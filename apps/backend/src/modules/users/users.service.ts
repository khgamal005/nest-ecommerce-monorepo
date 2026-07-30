import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: { email: string; password: string; name: string }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = this.usersRepository.create({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, data: Partial<Pick<User, 'name' | 'email'>>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  async updatePassword(id: string, password: string): Promise<void> {
    await this.usersRepository.update(id, { password });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }
}
