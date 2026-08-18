import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  token_hash: string;

  @Index()
  @Column()
  admin_id: string;

  @Column()
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
