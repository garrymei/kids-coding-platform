import { IsOptional, IsIn } from 'class-validator';

const validStatuses = ['pending', 'approved', 'rejected', 'revoked'];

export class GetConsentsDto {
  @IsOptional()
  @IsIn(validStatuses)
  status?: 'pending' | 'approved' | 'rejected' | 'revoked';
}
