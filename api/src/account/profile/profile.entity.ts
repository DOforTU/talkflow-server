import { Common } from 'src/common/entity/common.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { SupportedLanguage } from '../profile/profile.dto';
import { User } from '../user/user.entity';

@Entity('profile')
export class Profile extends Common {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'enum', enum: SupportedLanguage, nullable: true })
  language: SupportedLanguage | null;

  @OneToOne(() => User, (user) => user.profile)
  user: User;
}
