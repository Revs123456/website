import { IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  plan_id: string;
}

export class VerifySubscriptionDto {
  @IsString()
  razorpay_payment_id: string;

  @IsString()
  razorpay_subscription_id: string;

  @IsString()
  razorpay_signature: string;
}
