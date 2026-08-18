import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn()
  key: string;

  @Column('text')
  value: string;

  @Column({ nullable: true })
  label: string;

  @Column({ nullable: true })
  description: string;

  @UpdateDateColumn()
  updated_at: Date;
}
