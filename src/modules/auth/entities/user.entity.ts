export class UserEntity {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly avatarUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly passwordHash?: string; // không được serialize

  constructor(data: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    passwordHash?: string;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.phone = data.phone;
    this.avatarUrl = data.avatarUrl;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.passwordHash = data.passwordHash;
  }
}
