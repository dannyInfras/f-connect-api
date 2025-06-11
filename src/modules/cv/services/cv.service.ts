import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { CvAclService } from '../acl/cv.acl';
import { CreateCvReqDto } from '../dtos/req/create-cv.req';
import { UpdateCvReqDto } from '../dtos/req/update-cv.req';
import { CvResDto } from '../dtos/res/cv.res';
import { ListCvResDto } from '../dtos/res/list-cv.res';
import { CV } from '../entities/cv.entity';
import { CvRepository } from '../repositories/cv.repository';

@Injectable()
export class CvService {
  constructor(
    private readonly cvRepository: CvRepository,
    private readonly aclService: CvAclService,
  ) {}

  async create(createCvDto: CreateCvReqDto): Promise<CvResDto> {
    const cv = this.cvRepository.create({
      ...createCvDto,
      experience: Array.isArray(createCvDto.experience)
        ? createCvDto.experience.map((exp) => ({
            company: exp.company || '',
            role: exp.role || '',
            description: exp.description || '',
            employmentType: exp.employmentType || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate,
          }))
        : [],
      education: Array.isArray(createCvDto.education)
        ? createCvDto.education.map((edu) => ({
            institution: edu.institution || '',
            degree: edu.degree || '',
            field: edu.field || '',
            startYear: edu.startYear || '',
            endYear: edu.endYear || '',
            description: edu.description,
          }))
        : [],
      certifications: Array.isArray(createCvDto.certifications)
        ? createCvDto.certifications.map((cert) => ({
            title: cert.title || '',
            issuer: cert.issuer || '',
            issueDate: cert.issueDate || '',
            expiryDate: cert.expiryDate,
            credentialId: cert.credentialId || '',
            credentialUrl: cert.credentialUrl,
          }))
        : [],
    });
    const savedCv = await this.cvRepository.save(cv);
    return this.mapToDto(savedCv);
  }

  async findAll(page?: number, limit?: number): Promise<ListCvResDto> {
    const skip = page ? (page - 1) * (limit || 10) : 0;
    const take = limit || 10;

    const [cvs, total] = await this.cvRepository.findAndCount({
      skip: skip,
      take: take,
      order: { createdAt: 'DESC' },
    });

    return {
      items: cvs.map((cv) => this.mapToDto(cv)),
      meta: {
        total,
        page: page || 1,
        limit: take,
      },
    };
  }

  async findByUserId(
    actor: Actor,
    userId: number,
    limit: number,
    offset: number,
  ): Promise<ListCvResDto> {
    const [cvs, total] = await this.cvRepository.findAndCount({
      where: { userId },
      take: limit,
      skip: offset,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    if (!cvs.length) {
      throw new NotFoundException('No CVs found for this user');
    }

    // Check permissions for each CV
    cvs.forEach((cv) => {
      if (!this.aclService.forActor(actor).canDoAction(Action.Read, cv)) {
        throw new UnauthorizedException(
          'You do not have permission to view these CVs',
        );
      }
    });

    const page = Math.floor(offset / limit) + 1;

    return {
      items: cvs.map((cv) => this.mapToDto(cv)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<CV> {
    const cv = await this.cvRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!cv) {
      throw new NotFoundException(`CV with ID ${id} not found`);
    }
    return cv;
  }

  async update(id: string, updateCvDto: UpdateCvReqDto): Promise<CvResDto> {
    // Find existing CV
    const cv = await this.findOne(id);

    // Merge updates into the existing CV
    const updatedCv = this.cvRepository.merge(cv, updateCvDto);

    // Save the updated CV
    const savedCv = await this.cvRepository.save(updatedCv);

    // Map CV entity to CvResDto
    return this.mapToDto(savedCv);
  }

  async remove(id: string): Promise<void> {
    const cv = await this.findOne(id);
    await this.cvRepository.remove(cv);
  }

  public mapToDto(cv: CV): CvResDto {
    return {
      id: cv.id,
      title: cv.title,
      summary: cv.summary,
      name: cv.name,
      image: cv.image,
      email: cv.email,
      phone: cv.phone,
      linkedin: cv.linkedin,
      github: cv.github,
      experience: cv.experience || [],
      education: cv.education || [],
      skills: cv.skills,
      certifications: cv.certifications || [],
      languages: cv.languages,
      templateId: cv.templateId,
      userId: cv.userId,
      createdAt: cv.createdAt,
      updatedAt: cv.updatedAt,
    };
  }
}
