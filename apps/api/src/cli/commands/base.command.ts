import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@Command({
  name: 'base',
  description: 'Base command example',
})
export class BaseCommand extends CommandRunner {
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    console.log('히히 호출완료');
    console.log('Base command executed!');
    console.log('Parameters:', passedParams);
    console.log('Options:', options);
  }

  @Option({
    flags: '-f, --flag <flag>',
    description: 'A flag option',
  })
  parseFlag(val: string): string {
    return val;
  }
}
