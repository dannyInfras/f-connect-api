import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import {
  CreatePackageInput,
  UpdatePackageInput,
} from '@/modules/package/dtos/package-input.dto';
import { PackageOutput } from '@/modules/package/dtos/package-output.dto';
import { Package } from '@/modules/package/entities/package.entity';
import { PackageRepository } from '@/modules/package/repositories/package.repository';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@Injectable()
export class PackageService {
  constructor(
    private repository: PackageRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PackageService.name);
  }

  async createPackage(
    ctx: RequestContext,
    input: CreatePackageInput,
  ): Promise<PackageOutput> {
    this.logger.log(ctx, `${this.createPackage.name} was called`);

    const package_ = plainToClass(Package, input);

    this.logger.log(ctx, `calling ${PackageRepository.name}.save`);
    const savedPackage = await this.repository.save(package_);

    return plainToClass(PackageOutput, savedPackage, {
      excludeExtraneousValues: true,
    });
  }

  async getPackages(
    ctx: RequestContext,
    limit: number,
    offset: number,
  ): Promise<{ packages: PackageOutput[]; count: number }> {
    this.logger.log(ctx, `${this.getPackages.name} was called`);

    this.logger.log(ctx, `calling ${PackageRepository.name}.findAndCount`);
    const [packages, count] = await this.repository.findAndCount({
      where: {},
      take: limit,
      skip: offset,
    });

    const packagesOutput = plainToClass(PackageOutput, packages, {
      excludeExtraneousValues: true,
    });

    return { packages: packagesOutput, count };
  }

  async getPackageById(
    ctx: RequestContext,
    id: number,
  ): Promise<PackageOutput> {
    this.logger.log(ctx, `${this.getPackageById.name} was called`);

    this.logger.log(ctx, `calling ${PackageRepository.name}.getById`);
    const package_ = await this.repository.getById(id);

    return plainToClass(PackageOutput, package_, {
      excludeExtraneousValues: true,
    });
  }

  async updatePackage(
    ctx: RequestContext,
    packageId: number,
    input: UpdatePackageInput,
  ): Promise<PackageOutput> {
    this.logger.log(ctx, `${this.updatePackage.name} was called`);

    this.logger.log(ctx, `calling ${PackageRepository.name}.getById`);
    const package_ = await this.repository.getById(packageId);

    const updatedPackage: Package = {
      ...package_,
      ...input,
    };

    this.logger.log(ctx, `calling ${PackageRepository.name}.save`);
    const savedPackage = await this.repository.save(updatedPackage);

    return plainToClass(PackageOutput, savedPackage, {
      excludeExtraneousValues: true,
    });
  }

  async deletePackage(ctx: RequestContext, id: number): Promise<void> {
    this.logger.log(ctx, `${this.deletePackage.name} was called`);

    this.logger.log(ctx, `calling ${PackageRepository.name}.getById`);
    const package_ = await this.repository.getById(id);

    this.logger.log(ctx, `calling ${PackageRepository.name}.remove`);
    await this.repository.remove(package_);
  }
}
