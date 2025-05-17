import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateCompanyResDto } from '@/modules/company/dtos/res/create-company.res';
import { Actor } from '@/shared/acl/actor.constant';
import {
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateCompanyReqDto } from '../dtos/req/create-company.req';
import { UpdateCompanyDto } from '../dtos/req/update-company.req';
import { CompanyDetailResponseDto } from '../dtos/res/company-detail.res';
import { CompanyService } from '../services/company.service';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all companies with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([CreateCompanyResDto]),
    description: 'List of companies with pagination metadata',
    example: {
      data: [CreateCompanyResDto.example],
      meta: {
        count: 1,
        page: 1,
      },
    },
  })
  async findAll(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<CreateCompanyResDto[]>> {
    const { companies, count } = await this.companyService.findAll(
      ctx.user as Actor,
      query.limit,
      query.offset,
    );

    const data = plainToInstance(CreateCompanyResDto, companies, {
      excludeExtraneousValues: true,
    });

    return {
      data,
      meta: {
        count,
        page: query.offset / query.limit + 1,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiBody({
    type: CreateCompanyReqDto,
    examples: {
      createCompany: {
        summary: 'Example request to create a company',
        value: CreateCompanyReqDto.example,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateCompanyResDto,
    description: 'The created company',
    example: CreateCompanyResDto.example,
  })
  create(@Body() dto: CreateCompanyReqDto) {
    return this.companyService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: CompanyDetailResponseDto,
    description: 'The requested company',
    example: CompanyDetailResponseDto.example,
  })
  async findOne(@Param('id') id: string, @ReqContext() ctx: RequestContext) {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    const company = await this.companyService.findOne(id, ctx.user as Actor);
    return plainToInstance(CompanyDetailResponseDto, company, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company by ID' })
  @ApiBody({
    type: UpdateCompanyDto,
    examples: {
      updateCompany: {
        summary: 'Example request to update a company',
        value: UpdateCompanyDto.example,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: CreateCompanyResDto,
    description: 'The updated company',
    example: CreateCompanyResDto.updateExample,
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @ReqContext() ctx: RequestContext,
  ) {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.companyService.update(id, dto, ctx.user as Actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a company by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Confirmation of company deletion',
    example: {
      message: 'Company deleted successfully',
    },
  })
  delete(@Param('id') id: string, @ReqContext() ctx: RequestContext) {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.companyService.delete(id, ctx.user as Actor);
  }
}
