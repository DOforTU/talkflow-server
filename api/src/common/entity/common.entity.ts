import { CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

/**
 * Common Entity
 */
export class Common {
  /** Creation timestamp */
  @CreateDateColumn()
  createdAt: Date;

  /** Update timestamp */
  @UpdateDateColumn()
  updatedAt: Date;

  /** Deletion timestamp (set when soft deleted) */
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
