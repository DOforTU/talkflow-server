import { Common } from 'src/common/entity/common.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserProvider, UserRole } from './user.dto';
import { Profile } from '../profile/profile.entity';

@Entity('user')
// 삭제되지 않은 사용자에 대해서만 이메일 중복을 허용하지 않음
@Index('UQ_user_email_not_deleted', ['email'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class User extends Common {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  oauthId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserProvider,
    default: UserProvider.LOCAL,
  })
  provider: UserProvider;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastLogin: Date;

  @OneToOne(() => Profile, (profile) => profile.user, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profileId' })
  profile: Profile;
}
