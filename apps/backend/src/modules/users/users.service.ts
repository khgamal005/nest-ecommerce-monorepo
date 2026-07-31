import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { AddAddressDto } from './dto/add-address.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressesRepository: Repository<Address>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id }, relations: { addresses: true } });
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    addresses?: Partial<Address>[];
  }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = this.usersRepository.create({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    const savedUser = await this.usersRepository.save(user);

    if (data.addresses && data.addresses.length > 0) {
      const addresses = data.addresses.map((a) =>
        this.addressesRepository.create({ ...a, userId: savedUser.id }),
      );
      await this.addressesRepository.save(addresses);
    }

    const withAddresses = await this.findById(savedUser.id);
    if (!withAddresses) throw new ConflictException('Failed to create user');

    return withAddresses;
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

  async addAddress(userId: string, dto: AddAddressDto): Promise<Address> {
    const { label, street, city, zipCode, country, isDefault } = dto;

    if (isDefault) {
      await this.addressesRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const address = this.addressesRepository.create({
      userId,
      label,
      street,
      city,
      zipCode: zipCode ?? null,
      country,
      isDefault: isDefault ?? false,
    });

    return this.addressesRepository.save(address);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const result = await this.addressesRepository.delete({
      id: addressId,
      userId,
    });

    if (!result.affected) {
      throw new NotFoundException('Address not found');
    }
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.addressesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
