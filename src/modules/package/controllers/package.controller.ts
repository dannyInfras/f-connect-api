import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import {
  CreatePackageInput,
  UpdatePackageInput,
} from '../dtos/package-input.dto';
import { PackageOutput } from '../dtos/package-output.dto';
import { PackageService } from '../services/package.service';

@ApiTags('packages')
@Controller('packages')
@UseInterceptors(ClassSerializerInterceptor)
export class PackageController {
  constructor(
    private readonly packageService: PackageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PackageController.name);
  }

  @Post()
  @ApiOperation({
    summary: 'Create package API',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SwaggerBaseApiResponse(PackageOutput),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createPackage(
    @ReqContext() ctx: RequestContext,
    @Body() input: CreatePackageInput,
  ): Promise<BaseApiResponse<PackageOutput>> {
    const package_ = await this.packageService.createPackage(ctx, input);
    return { data: package_, meta: {} };
  }

  @Get()
  @ApiOperation({
    summary: 'Get packages as a list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([PackageOutput]),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getPackages(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<PackageOutput[]>> {
    this.logger.log(ctx, `${this.getPackages.name} was called`);

    const { packages, count } = await this.packageService.getPackages(
      ctx,
      query.limit,
      query.offset,
    );

    return { data: packages, meta: { count } };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get package by id API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(PackageOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getPackage(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<PackageOutput>> {
    this.logger.log(ctx, `${this.getPackage.name} was called`);

    const package_ = await this.packageService.getPackageById(ctx, id);
    return { data: package_, meta: {} };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update package API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(PackageOutput),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updatePackage(
    @ReqContext() ctx: RequestContext,
    @Param('id') packageId: number,
    @Body() input: UpdatePackageInput,
  ): Promise<BaseApiResponse<PackageOutput>> {
    const package_ = await this.packageService.updatePackage(
      ctx,
      packageId,
      input,
    );
    return { data: package_, meta: {} };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete package by id API',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deletePackage(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.deletePackage.name} was called`);
    return this.packageService.deletePackage(ctx, id);
  }
}
