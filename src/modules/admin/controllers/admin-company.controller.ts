import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Roles } from '@/modules/auth/decorators/role.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { AdminCompaniesResponseDto } from '../dtos/admin-companies-response.dto';
import { AdminCompanyDetailOutput } from '../dtos/admin-company-detail-output.dto';
import { AdminCompanyOutput } from '../dtos/admin-company-output.dto';
import { AdminCompanyService } from '../services/admin-company.service';

@ApiTags('Admin Company Management')
@Controller('admin/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(ROLE.ADMIN)
export class AdminCompanyController {
  constructor(
    private readonly adminCompanyService: AdminCompanyService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AdminCompanyController.name);
  }

  @Get()
  @ApiOperation({ summary: 'List companies' })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminCompaniesResponseDto),
  })
  async listCompanies(
    @ReqContext() ctx: RequestContext,
    @Query() pagination: PaginationParamsDto,
    @Query('isVerified') isVerified?: string,
  ): Promise<BaseApiResponse<AdminCompaniesResponseDto>> {
    this.logger.log(ctx, `${this.listCompanies.name} was called`);
    const filters =
      typeof isVerified === 'string'
        ? { isVerified: isVerified === 'true' }
        : undefined;

    const result = await this.adminCompanyService.listCompanies(
      ctx,
      ctx.user!,
      pagination.limit,
      pagination.offset,
      filters,
    );

    return { data: result, meta: { apiVersion: '1.0' } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company details' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminCompanyDetailOutput),
  })
  async getCompanyById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<BaseApiResponse<AdminCompanyDetailOutput>> {
    this.logger.log(ctx, `${this.getCompanyById.name} was called`);
    const company = await this.adminCompanyService.getCompanyById(
      ctx,
      ctx.user!,
      id,
    );
    return { data: company, meta: { apiVersion: '1.0' } };
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify (accept) a pending company' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminCompanyOutput),
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: BaseApiErrorResponse })
  async verifyCompany(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<BaseApiResponse<AdminCompanyOutput>> {
    this.logger.log(ctx, `${this.verifyCompany.name} was called`);
    const company = await this.adminCompanyService.verifyCompany(
      ctx,
      ctx.user!,
      id,
    );
    return { data: company, meta: { apiVersion: '1.0' } };
  }

  @Patch(':id/unverify')
  @ApiOperation({
    summary: 'Unverify (revoke verification of) a verified company',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminCompanyOutput),
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: BaseApiErrorResponse })
  async unverifyCompany(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<BaseApiResponse<AdminCompanyOutput>> {
    this.logger.log(ctx, `${this.unverifyCompany.name} was called`);
    const company = await this.adminCompanyService.unverifyCompany(
      ctx,
      ctx.user!,
      id,
    );
    return { data: company, meta: { apiVersion: '1.0' } };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Reject a pending company (remove it)' })
  @ApiResponse({ status: HttpStatus.OK, type: SwaggerBaseApiResponse(String) })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: BaseApiErrorResponse })
  async rejectCompany(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<BaseApiResponse<{ message: string }>> {
    this.logger.log(ctx, `${this.rejectCompany.name} was called`);
    const result = await this.adminCompanyService.rejectCompany(
      ctx,
      ctx.user!,
      id,
    );
    return { data: result, meta: { apiVersion: '1.0' } };
  }
}
