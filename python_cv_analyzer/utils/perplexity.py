"""
Perplexity AI integration for CV analysis.
"""

import json
import requests
from typing import Dict, Any
from config import config
from logger import get_logger
from .retry import retry_on_exception, RetryError

logger = get_logger('perplexity')


def build_analysis_prompt(cv_text: str, job_details: Dict[str, Any]) -> str:
    """
    Build analysis prompt for Perplexity AI.
    
    Args:
        cv_text: Extracted CV text
        job_details: Job information from database
        
    Returns:
        Formatted prompt for AI analysis
    """
    job_title = job_details.get('title', 'Unknown Position')
    job_description = job_details.get('description', '')
    job_requirements = job_details.get('requirements', '')
    experience_years = job_details.get('experience_years', 0)
    company_name = job_details.get('company_name', 'Unknown Company')
    
    prompt = f"""
Analyze this CV against the job requirements and provide a detailed assessment.

**Job Information:**
- Position: {job_title}
- Company: {company_name}
- Required Experience: {experience_years} years
- Description: {job_description}
- Requirements: {job_requirements}

**CV Content:**
{cv_text}

**Analysis Instructions:**
Please analyze how well this CV matches the job requirements and provide:
1. A score from 0-100 (where 100 is a perfect match)
2. A detailed analysis covering:
   - Relevant experience and skills match
   - Education background fit
   - Strengths for this role
   - Areas of concern or gaps
   - Overall recommendation

Respond ONLY with a JSON object in this exact format:
{{
    "score": <integer 0-100>,
    "analysis": "<detailed text analysis>"
}}
"""
    
    return prompt.strip()


@retry_on_exception(max_retries=config.PERPLEXITY_MAX_RETRIES)
def call_perplexity_api(prompt: str) -> Dict[str, Any]:
    """
    Call Perplexity AI API with retry logic.
    
    Args:
        prompt: Analysis prompt
        
    Returns:
        API response data
        
    Raises:
        requests.RequestException: If API call fails
        ValueError: If API returns invalid response
    """
    headers = {
        'Authorization': f'Bearer {config.PERPLEXITY_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'model': config.PERPLEXITY_MODEL,
        'messages': [
            {
                'role': 'user',
                'content': prompt
            }
        ],
        'max_tokens': 2000,
        'temperature': 0.1
    }
    
    logger.info("Calling Perplexity AI API")
    
    try:
        response = requests.post(
            config.PERPLEXITY_API_URL,
            headers=headers,
            json=payload,
            timeout=config.PERPLEXITY_TIMEOUT
        )
        
        response.raise_for_status()
        api_data = response.json()
        
        logger.info("Perplexity AI API call successful")
        return api_data
        
    except requests.RequestException as e:
        logger.error(f"Perplexity API request failed: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON response from Perplexity API: {e}")
        raise ValueError(f"Invalid API response format: {e}")


def parse_analysis_response(api_response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse the API response and extract analysis results.
    
    Args:
        api_response: Raw API response from Perplexity
        
    Returns:
        Parsed analysis results
        
    Raises:
        ValueError: If response format is invalid or missing required fields
    """
    # Extract content from API response
    choices = api_response.get('choices', [])
    if not choices:
        raise ValueError("No choices in API response")
    
    content = choices[0].get('message', {}).get('content', '')
    if not content:
        raise ValueError("No content in API response")
    
    logger.debug("Raw API response received")
    
    # Try to parse JSON from content
    # Sometimes the response might have extra text, so we look for JSON
    content = content.strip()
    
    # Find JSON block in the response
    json_start = content.find('{')
    json_end = content.rfind('}') + 1
    
    if json_start == -1 or json_end == 0:
        raise ValueError("No JSON found in API response")
    
    json_content = content[json_start:json_end]
    
    try:
        analysis_result = json.loads(json_content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in response: {e}")
    
    # Validate required fields
    if 'score' not in analysis_result or 'analysis' not in analysis_result:
        raise ValueError("Missing required fields (score, analysis) in response")
    
    # Validate score range
    score = analysis_result['score']
    if not isinstance(score, (int, float)) or score < 0 or score > 100:
        raise ValueError(f"Invalid score value: {score}. Must be 0-100")
    
    # Ensure score is integer
    analysis_result['score'] = int(score)
    
    # Validate analysis text
    if not isinstance(analysis_result['analysis'], str) or not analysis_result['analysis'].strip():
        raise ValueError("Analysis text is empty or invalid")
    
    logger.info("Successfully parsed analysis result")
    return analysis_result


def analyze_cv_with_perplexity(cv_text: str, job_details: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze CV using Perplexity AI.
    
    Args:
        cv_text: Extracted text from CV
        job_details: Job details from database
        
    Returns:
        Analysis result with score and analysis text
        
    Raises:
        ValueError: If input data is invalid
        RetryError: If API calls fail after retries
    """
    # Validate inputs
    if not cv_text or not cv_text.strip():
        raise ValueError("CV text is empty")
    
    if not job_details:
        raise ValueError("Job details are required")
    
    # Build prompt
    prompt = build_analysis_prompt(cv_text, job_details)
    
    # Call API with retries
    api_response = call_perplexity_api(prompt)
    
    # Parse and validate response
    analysis_result = parse_analysis_response(api_response)
    
    logger.info("CV analysis completed successfully")
    return analysis_result
