import { Reporter, TestModule, TestCase, TestRunEndReason } from 'vitest/node';
import type { SerializedError } from '@vitest/utils';
import { Storage } from 'tdd-guard';
export declare class VitestReporter implements Reporter {
    private readonly storage;
    private readonly collectedData;
    constructor(storageOrRoot?: Storage | string);
    onTestModuleCollected(testModule: TestModule): void;
    onTestCaseResult(testCase: TestCase): void;
    onTestRunEnd(_testModules?: ReadonlyArray<TestModule>, unhandledErrors?: ReadonlyArray<SerializedError>, reason?: TestRunEndReason): Promise<void>;
}
//# sourceMappingURL=VitestReporter.d.ts.map