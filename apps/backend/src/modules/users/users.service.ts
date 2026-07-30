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

  async create(data: { email: string; passwordHash: string; fullName: string; role?: string }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = this.usersRepository.create({
      email: data.email,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      role: (data.role as User['role']) ?? 'customer',
    });

    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, data: Partial<Pick<User, 'fullName' | 'email'>>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { passwordHash });
  }

  async setResetToken(id: string, token: string, expiry: Date): Promise<void> {
    await this.usersRepository.update(id, { resetToken: token, resetTokenExpiry: expiry });
  }

  async clearResetToken(id: string): Promise<void> {
    await this.usersRepository.update(id, { resetToken: null, resetTokenExpiry: null });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { resetToken: token } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }
}
