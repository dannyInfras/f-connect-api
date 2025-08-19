"""
Default HR CV Screening Checklist Constants.

This module contains the default universal HR checklist used when companies
don't have their own custom checklist defined.
"""

DEFAULT_HR_CHECKLIST = [
    {
        "id": "contact_info",
        "criterion": "Contact info present & accurate",
        "weight": 8,
        "required": True,
        "description": "Name, phone, email valid and professional"
    },
    {
        "id": "professional_summary",
        "criterion": "Professional summary/objective",
        "weight": 7,
        "required": False,
        "description": "Clear, role-targeted summary that demonstrates purpose"
    },
    {
        "id": "relevant_experience",
        "criterion": "Relevant experience",
        "weight": 9,
        "required": True,
        "description": "Work history that fits role requirements and level"
    },
    {
        "id": "achievements_impact",
        "criterion": "Achievements/impact",
        "weight": 8,
        "required": False,
        "description": "Quantified results and measurable achievements listed"
    },
    {
        "id": "skills_qualifications",
        "criterion": "Skills/qualifications (role-fit)",
        "weight": 9,
        "required": True,
        "description": "Skills match job description and requirements"
    },
    {
        "id": "education_certifications",
        "criterion": "Education/certifications",
        "weight": 7,
        "required": False,
        "description": "Required degree/certifications noted if applicable"
    },
    {
        "id": "employment_dates",
        "criterion": "Employment dates/career path",
        "weight": 6,
        "required": False,
        "description": "Dates shown with steady growth, minimal gaps"
    },
    {
        "id": "formatting_readability",
        "criterion": "Formatting/readability/clarity",
        "weight": 5,
        "required": True,
        "description": "Well-organized sections, professional appearance"
    },
    {
        "id": "customization",
        "criterion": "Customization to job/sector",
        "weight": 7,
        "required": False,
        "description": "Resume appears tailored to specific role or industry"
    },
    {
        "id": "red_flags",
        "criterion": "Red flags (if any)",
        "weight": 10,
        "required": True,
        "description": "Check for errors, unexplained gaps, or inconsistencies"
    }
]

def get_default_checklist_name() -> str:
    """Get the name of the default checklist."""
    return "Universal HR CV Screening Checklist"

def get_default_checklist_description() -> str:
    """Get the description of the default checklist."""
    return "Standard HR checklist for all job types - facilitates fast, objective review for both manual and ATS-based screening"
