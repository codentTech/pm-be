import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { BidLossReason } from "src/common/types/bid-loss-reason.enum";
import { BidPlatform } from "src/common/types/bid-platform.enum";
import { BidStatus } from "src/common/types/bid-status.enum";
import { BidWithdrawalReason } from "src/common/types/bid-withdrawal-reason.enum";

export class CreateBidDto {
  @ApiPropertyOptional({
    description: "Organization ID (defaults to current org from header)",
  })
  @IsOptional()
  @IsUUID()
  OrganizationId?: string;

  @ApiProperty({ enum: BidPlatform, example: BidPlatform.UPWORK })
  @IsEnum(BidPlatform)
  @IsNotEmpty()
  Platform: BidPlatform;

  @ApiProperty({
    example: "https://upwork.com/job/123",
    description: "Job URL or reference",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  JobUrlOrReference: string;

  @ApiProperty({ example: "Acme Corp" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ClientDisplayName: string;

  @ApiProperty({ example: "Build a React dashboard" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  BidTitle: string;

  @ApiPropertyOptional({ example: "$500–1K" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ClientBudget?: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  ProposedPrice: number;

  @ApiPropertyOptional({ example: "USD", default: "USD" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  Currency?: string;

  @ApiProperty({ example: 40, description: "Estimated hours" })
  @IsNumber()
  @Min(0)
  EstimatedEffort: number;

  @ApiPropertyOptional({
    example: ["React", "Node.js"],
    description: "Skills and tags",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  SkillsTags?: string[];

  @ApiProperty({
    example: "2026-01-15",
    description: "Submission date (YYYY-MM-DD)",
  })
  @IsDateString()
  SubmissionDate: string;

  @ApiPropertyOptional({ enum: BidStatus, default: BidStatus.DRAFT })
  @IsOptional()
  @IsEnum(BidStatus)
  CurrentStatus?: BidStatus;

  @ApiPropertyOptional({ example: 0.7, description: "Win probability 0–1" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  Probability?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  CompetitorNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  RiskFlags?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  InternalComments?: string;

  @ApiPropertyOptional({ description: "Interview date (ISO string)" })
  @IsOptional()
  @IsDateString()
  InterviewDate?: string;

  @ApiPropertyOptional({ description: "Interview outcome summary" })
  @IsOptional()
  @IsString()
  InterviewOutcome?: string;
}

export class UpdateBidDto extends PartialType(CreateBidDto) {}

export class TransitionBidStatusDto {
  @ApiProperty({ enum: BidStatus })
  @IsEnum(BidStatus)
  @IsNotEmpty()
  Status: BidStatus;

  @ApiPropertyOptional({
    description: "Required for Lost",
    enum: BidLossReason,
  })
  @IsOptional()
  @IsEnum(BidLossReason)
  LossReason?: BidLossReason;

  @ApiPropertyOptional({ description: "Required when LossReason is OTHER" })
  @IsOptional()
  @IsString()
  LossReasonOther?: string;

  @ApiPropertyOptional({
    description: "Required for Withdrawn",
    enum: BidWithdrawalReason,
  })
  @IsOptional()
  @IsEnum(BidWithdrawalReason)
  WithdrawalReason?: BidWithdrawalReason;

  @ApiPropertyOptional({ description: "Required when moving to Interview" })
  @IsOptional()
  @IsDateString()
  InterviewDate?: string;

  @ApiPropertyOptional({ description: "Required before terminal state from Interview" })
  @IsOptional()
  @IsString()
  InterviewOutcome?: string;

  @ApiPropertyOptional({ description: "Required for Won" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  FinalAgreedPrice?: number;

  @ApiPropertyOptional({ description: "Required for Won" })
  @IsOptional()
  @IsDateString()
  ExpectedStartDate?: string;

  @ApiPropertyOptional({ description: "For Won" })
  @IsOptional()
  @IsString()
  FinalScopeNotes?: string;
}

export class BulkDeleteBidsDto {
  @ApiProperty({ type: [String], description: "Array of bid IDs to delete" })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}
