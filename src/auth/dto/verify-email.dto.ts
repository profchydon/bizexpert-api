import { IsEmail, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { SIGNUP_OTP_LENGTH } from "../otp";

export class VerifyEmailDto {
  @ApiProperty({ example: "chidi@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456", minLength: SIGNUP_OTP_LENGTH })
  @IsString()
  @Length(SIGNUP_OTP_LENGTH, SIGNUP_OTP_LENGTH)
  otp: string;
}
