import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { EntityManager } from 'typeorm';

import { CompanyRepository } from '@/modules/company/repositories/company.repository';
import { CreateUserInput } from '@/modules/user/dtos/user-create-input.dto';
import { UserOutput } from '@/modules/user/dtos/user-output.dto';
import { UpdateUserInput } from '@/modules/user/dtos/user-update-input.dto';
import { VerifyUserInput } from '@/modules/user/dtos/user-verify-input.dto';
import { User } from '@/modules/user/entities/user.entity';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { Company } from '../../company/entities/company.entity';

@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private readonly logger: AppLogger,
    private readonly companyRepository: CompanyRepository,
  ) {
    this.logger.setContext(UserService.name);
  }
  async createUser(
    ctx: RequestContext,
    input: CreateUserInput,
    manager?: EntityManager,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.createUser.name} was called`);

    const user = plainToClass(User, input);
    user.password = await hash(input.password, 10);

    if (input.companyId) {
      const companyRepo = manager
        ? manager.getRepository(Company)
        : this.companyRepository;

      const company = await companyRepo.findOne({
        where: { id: String(input.companyId) },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }
      user.company = company;
    }

    const userRepo = manager ? manager.getRepository(User) : this.repository;

    this.logger.log(ctx, `calling ${UserRepository.name}.saveUser`);
    await userRepo.save(user);

    return plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
  }

  async validateUsernamePassword(
    ctx: RequestContext,
    username: string,
    pass: string,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.validateUsernamePassword.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findOne`);
    const user = await this.repository.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException();

    const match = await compare(pass, user.password);
    if (!match) throw new UnauthorizedException();

    return plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
  }

  async validateEmailPassword(
    ctx: RequestContext,
    email: string,
    pass: string,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.validateEmailPassword.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findOne`);
    const user = await this.repository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException();

    const match = await compare(pass, user.password);
    if (!match) throw new UnauthorizedException();

    return plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
  }

  async getUsers(
    ctx: RequestContext,
    limit: number,
    offset: number,
  ): Promise<{ users: UserOutput[]; count: number }> {
    this.logger.log(ctx, `${this.getUsers.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findAndCount`);
    const [users, count] = await this.repository.findAndCount({
      where: {},
      take: limit,
      skip: offset,
      relations: ['company']
    });

    const usersOutput = plainToClass(UserOutput, users, {
      excludeExtraneousValues: true,
    });
    usersOutput.forEach((u, i) => {
      u.companyId = users[i].company?.id || null;
    });

    return { users: usersOutput, count };
  }

  async findById(ctx: RequestContext, id: number): Promise<UserOutput> {
    this.logger.log(ctx, `${this.findById.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findOne`);
    const user = await this.repository.findOne({ 
      where: { id },
      relations: ['company']
    });
    if (!user) throw new NotFoundException('User not found');

    const userOutput = plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
    userOutput.companyId = user.company?.id || null;
    return userOutput;
  }

  async getUserById(ctx: RequestContext, id: number): Promise<UserOutput> {
    this.logger.log(ctx, `${this.getUserById.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.getById`);
    const user = await this.repository.getById(id);
    if (!user) throw new NotFoundException('User not found');

    const userOutput = plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
    userOutput.companyId = user.company?.id || null;
    return userOutput;
  }

  async findByUsername(
    ctx: RequestContext,
    username: string,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.findByUsername.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findOne`);
    const user = await this.repository.findOne({ 
      where: { username },
      relations: ['company']
    });
    if (!user) throw new NotFoundException('User not found');

    const userOutput = plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
    userOutput.companyId = user.company?.id || null;
    return userOutput;
  }

  async updateUser(
    ctx: RequestContext,
    userId: number,
    input: UpdateUserInput,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.updateUser.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.getById`);
    const user = await this.repository.getById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Hash the password if it exists in the input payload.
    if (input.password) {
      input.password = await hash(input.password, 10);
    }

    // merges the input (2nd line) to the found user (1st line)
    const updatedUser: User = {
      ...user,
      ...input,
    };

    this.logger.log(ctx, `calling ${UserRepository.name}.save`);
    await this.repository.save(updatedUser);

    const userOutput = plainToClass(UserOutput, updatedUser, {
      excludeExtraneousValues: true,
    });
    userOutput.companyId = updatedUser.company?.id || null;
    return userOutput;
  }

  async verifyUser(
    ctx: RequestContext,
    id: number,
    isAccountDisabled: boolean,
  ): Promise<VerifyUserInput> {
    this.logger.log(ctx, `${this.verifyUser.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.getById`);
    const user = await this.repository.getById(id);

    const updatedUser: User = {
      ...user,
      isAccountDisabled,
    };

    this.logger.log(ctx, `calling ${UserRepository.name}.save`);
    await this.repository.save(updatedUser);

    return plainToClass(VerifyUserInput, updatedUser, {
      excludeExtraneousValues: true,
    });
  }
}
