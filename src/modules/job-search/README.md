# Job Search Module

Advanced job search functionality with full-text search, comprehensive filtering, and pagination capabilities.

## Features

### ✨ Core Capabilities

- **Full-text Search**: PostgreSQL tsvector-based search on job title, description, and responsibilities
- **Advanced Filtering**: Filter by category, company, location, salary, experience, employment type
- **Intelligent Sorting**: Sort by relevance, date, salary, experience requirements
- **Pagination**: Efficient cursor-based pagination with metadata
- **Application Statistics**: Real-time application counts and capacity information
- **Search Suggestions**: Autocomplete functionality for job titles, companies, and locations
- **Role-based Access Control**: Fine-grained permissions based on user roles

### 🔍 Search Capabilities

- **Text Search**: Searches across job titles, descriptions, and responsibilities with relevance ranking
- **Location Search**: Fuzzy matching on job locations
- **Category Filtering**: Filter by multiple job categories
- **Company Filtering**: Filter by specific companies
- **Employment Type**: Filter by Full-time, Part-time, Contract, Internship, Remote
- **Salary Range**: Filter by minimum and maximum salary ranges
- **Experience Level**: Filter by minimum years of experience required
- **Active Jobs Only**: Filter to show only jobs within their deadline

## API Endpoints

### 🔍 Search Jobs

```
GET /api/v1/job-search/search
```

#### Query Parameters

- `q` (string, optional): Search query for full-text search
- `location` (string, optional): Location filter
- `categoryIds` (string[], optional): Array of category IDs
- `companyIds` (string[], optional): Array of company IDs
- `employmentTypes` (EmploymentType[], optional): Array of employment types
- `salaryMin` (number, optional): Minimum salary filter
- `salaryMax` (number, optional): Maximum salary filter
- `minExperienceYears` (number, optional): Minimum experience years
- `activeOnly` (boolean, optional): Show only active jobs (default: true)
- `sortBy` (JobSearchSortBy, optional): Sort order (default: relevance)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)

#### Example Requests

**Basic Search:**

```bash
GET /job-search/search?q=React Developer&location=New York&page=1&limit=10
```

**Advanced Filtering:**

```bash
GET /job-search/search?categoryIds=1,2&employmentTypes=FullTime,Remote&salaryMin=80000&salaryMax=150000&sortBy=salary_high_to_low
```

**Company-specific Search:**

```bash
GET /job-search/search?companyIds=5,10&minExperienceYears=3&activeOnly=true
```

#### Response Format

```json
{
  "data": [
    {
      "id": "1",
      "title": "Senior React Developer",
      "description": "Job description...",
      "location": "New York, NY",
      "salaryMin": 90000,
      "salaryMax": 130000,
      "experienceYears": 5,
      "typeOfEmployment": "FullTime",
      "deadline": "2024-03-15T23:59:59.000Z",
      "company": {
        "id": "5",
        "companyName": "Tech Corp",
        "logoUrl": "https://...",
        "industry": "Technology"
      },
      "category": {
        "id": "1",
        "name": "Technology"
      },
      "applicationStats": {
        "totalApplications": 25,
        "maxCapacity": 50,
        "applicationRate": 50
      },
      "relevanceScore": 0.875,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalItems": 143,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filterSummary": {
    "query": "React Developer",
    "location": "New York",
    "categoriesCount": 0,
    "companiesCount": 0,
    "employmentTypesCount": 0,
    "activeOnly": true,
    "sortBy": "relevance"
  },
  "meta": {
    "message": "Found 143 jobs",
    "success": true
  }
}
```

### 💡 Search Suggestions

```
GET /api/v1/job-search/suggestions?q=react
```

#### Response Format

```json
{
  "data": [
    {
      "type": "job_title",
      "value": "React Developer",
      "count": 45
    },
    {
      "type": "company",
      "value": "React Technologies Inc",
      "count": 12
    },
    {
      "type": "location",
      "value": "New York, NY",
      "count": 89
    }
  ],
  "meta": {
    "message": "Search suggestions retrieved successfully",
    "success": true
  }
}
```

## Usage Examples

### Frontend Integration

#### Basic Search Component

```typescript
import { JobSearchService } from '@/modules/job-search';

class JobSearchComponent {
  async searchJobs(searchParams: JobSearchDto) {
    try {
      const response =
        await this.jobSearchService.searchWithCursor(searchParams);

      // Handle search results
      console.log(`Found ${response.pagination.totalItems} jobs`);
      response.data.forEach((job) => {
        console.log(`${job.title} at ${job.company.companyName}`);
      });
    } catch (error) {
      console.error('Search failed:', error);
    }
  }
}
```

#### Autocomplete Integration

```typescript
async getSearchSuggestions(query: string) {
  if (query.length < 2) return [];

  const response = await this.jobSearchService.getSearchSuggestions(query);
  return response.data.map(suggestion => ({
    label: suggestion.value,
    value: suggestion.value,
    type: suggestion.type,
    count: suggestion.count
  }));
}
```

### Backend Service Usage

```typescript
import { JobSearchService, JobSearchDto } from '@/modules/job-search';

@Injectable()
export class MyService {
  constructor(private jobSearchService: JobSearchService) {}

  async findRelevantJobs(userId: string) {
    const searchParams: JobSearchDto = {
      q: 'software engineer',
      location: 'San Francisco',
      salaryMin: 100000,
      employmentTypes: ['FullTime', 'Remote'],
      activeOnly: true,
      sortBy: JobSearchSortBy.RELEVANCE,
      limit: 20,
    };

    return this.jobSearchService.searchWithCursor(searchParams);
  }
}
```

## Configuration

### Database Setup

The module requires the PostgreSQL full-text search migration to be applied:

```bash
npm run migration:run
```

This will:

1. Add a `tsv` tsvector column to the `job` table
2. Create a GIN index for performance
3. Set up triggers to automatically update the search vector

### Module Registration

```typescript
// app.module.ts
import { JobSearchModule } from '@/modules/job-search';

@Module({
  imports: [
    // ... other modules
    JobSearchModule,
  ],
})
export class AppModule {}
```

## Performance Considerations

### Database Optimization

- **GIN Index**: The tsvector column uses a GIN index for fast full-text search
- **Query Optimization**: Filters are applied before text search for better performance
- **Pagination**: Uses efficient LIMIT/OFFSET with total count optimization

### Caching Strategies

- Consider caching frequently searched terms and their results
- Implement Redis caching for search suggestions
- Cache application statistics for better performance

### Search Performance Tips

1. **Use specific terms**: More specific search queries perform better
2. **Combine filters**: Use category and location filters to narrow results
3. **Limit results**: Use appropriate page sizes (10-25 items work well)
4. **Sort efficiently**: Relevance sorting with text search is most efficient

## Security & Access Control

### Role-based Permissions

- **Admin**: Full access to all search operations
- **Admin Recruiter**: Read and list access to all jobs
- **Recruiter**: Read and list access to jobs
- **User/Candidate**: Read and list access to public jobs
- **Unauthenticated**: Limited access to basic search without sensitive filters

### Data Protection

- Sensitive company information is filtered based on user permissions
- Personal candidate data is never exposed in search results
- Search queries are logged for analytics but not stored with user identifiers

## Testing

### Unit Tests

```bash
npm run test -- job-search
```

### Integration Tests

```bash
npm run test:e2e -- job-search
```

### Example Test Cases

- Full-text search functionality
- Filter combinations
- Pagination edge cases
- ACL permission validation
- Search suggestion accuracy

## Monitoring & Analytics

### Metrics to Track

- Search query performance
- Most popular search terms
- Filter usage patterns
- Zero-result searches
- API response times

### Logging

The service logs:

- Search queries and filters used
- Response times for optimization
- Failed searches for debugging
- ACL access denials for security monitoring

## Future Enhancements

### Planned Features

- **Geolocation Search**: Distance-based job search
- **Machine Learning**: Personalized job recommendations
- **Advanced Filters**: Skills matching, company culture fit
- **Search Analytics**: Detailed search behavior insights
- **Elasticsearch Integration**: For even more advanced search capabilities

### Optimization Opportunities

- Implement search result caching
- Add search query analytics
- Optimize database queries further
- Add advanced filtering options
