import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

type IAuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
export class AuthenticationController {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: IAuthenticateBodySchema) {
    const { email, password } = body

    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new UnauthorizedException('User credentials do not match.')
    }

    const isPassowordValid = await compare(password, user.password)

    if (!isPassowordValid) {
      throw new UnauthorizedException('User credentials do not match.')
    }

    const acessToken = this.jwt.sign({ sub: user.id })

    return {
      access_token: acessToken,
    }
  }
}
