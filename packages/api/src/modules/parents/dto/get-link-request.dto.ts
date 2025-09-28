import { IsOptional, IsIn } from 'class-validator';

const validStatuses = ['pending', 'approved', 'rejected'];

export class GetLinkRequestsDto {
  @IsOptional()
  @IsIn(validStatuses)
  status?: 'pending' | 'approved' | 'rejected';
}
