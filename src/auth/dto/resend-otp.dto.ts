import { IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResendOtpDto {
  @ApiProperty({ example: "chidi@example.com" })
  @IsEmail()
  email: string;
}
