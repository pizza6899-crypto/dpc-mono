// Mock transactional decorator to be a no-op during unit tests
export const Transactional = () => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor;
// Mock parameter decorator used for injecting transaction objects
export const InjectTransaction = () => (_target: any, _propertyKey: string | symbol, _parameterIndex?: number) => {}; 
