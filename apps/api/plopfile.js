// plopfile.js
module.exports = function (plop) {
  // Helper: PascalCase 변환
  plop.setHelper('pascalCase', function (text) {
    return text
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  });

  // Helper: camelCase 변환
  plop.setHelper('camelCase', function (text) {
    const pascal = plop.getHelper('pascalCase')(text);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  });

  // Helper: kebab-case 변환
  plop.setHelper('kebabCase', function (text) {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  });

  // Helper: 첫 글자 소문자
  plop.setHelper('lowerFirst', function (text) {
    return text.charAt(0).toLowerCase() + text.slice(1);
  });

  // Helper: CONSTANT_CASE 변환
  plop.setHelper('constantCase', function (text) {
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-_]+/g, '_')
      .toUpperCase();
  });

  // Generator: 전체 모듈 생성 (헥사고날 아키텍처)
  plop.setGenerator('module', {
    description: '헥사고날 아키텍처 기반 모듈 생성',
    prompts: [
      {
        type: 'input',
        name: 'moduleName',
        message: '모듈 이름을 입력하세요 (예: user, order):',
        validate: (value) => {
          if (!value) return '모듈 이름은 필수입니다';
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return '소문자, 숫자, 하이픈만 사용 가능합니다';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'parentPath',
        message: '부모 경로를 입력하세요 (예: affiliate, auth) - 비워두면 modules 루트:',
        default: '',
      },
      {
        type: 'confirm',
        name: 'withEntity',
        message: '도메인 엔티티를 생성하시겠습니까?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'withPolicy',
        message: '도메인 정책(Policy)을 생성하시겠습니까?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'withException',
        message: '도메인 예외(Exception)를 생성하시겠습니까?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'withRepository',
        message: 'Repository를 생성하시겠습니까?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'withMapper',
        message: 'Mapper를 생성하시겠습니까?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'withService',
        message: 'Application Service를 생성하시겠습니까?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'withController',
        message: 'Controller를 생성하시겠습니까?',
        default: false,
      },
    ],
    actions: (data) => {
      const actions = [];
      const parentPath = data.parentPath || '';
      const modulePath = parentPath
        ? `src/modules/${parentPath}/{{kebabCase moduleName}}`
        : `src/modules/{{kebabCase moduleName}}`;

      // 디렉토리 구조만 생성 (.gitkeep 파일로 디렉토리 유지)
      // 주의: test 폴더는 생성하지 않음
      
      // Module 파일 생성 (예외적으로 파일 생성)
      actions.push({
        type: 'add',
        path: `${modulePath}/{{kebabCase moduleName}}.module.ts`,
        templateFile: 'plop-templates/module/module.ts.hbs',
        data: { parentPath: parentPath },
      });

      // Domain 디렉토리
      actions.push({
        type: 'add',
        path: `${modulePath}/domain/.gitkeep`,
        template: '',
      });

      // Domain - Model 디렉토리
      if (data.withEntity) {
        actions.push({
          type: 'add',
          path: `${modulePath}/domain/model/.gitkeep`,
          template: '',
        });
      }

      // Application 디렉토리
      if (data.withService) {
        actions.push({
          type: 'add',
          path: `${modulePath}/application/.gitkeep`,
          template: '',
        });
      }

      // Infrastructure 디렉토리
      if (data.withRepository || data.withMapper) {
        actions.push({
          type: 'add',
          path: `${modulePath}/infrastructure/.gitkeep`,
          template: '',
        });
      }

      // Ports 디렉토리
      if (data.withRepository) {
        actions.push({
          type: 'add',
          path: `${modulePath}/ports/.gitkeep`,
          template: '',
        });
        actions.push({
          type: 'add',
          path: `${modulePath}/ports/out/.gitkeep`,
          template: '',
        });
      }

      // Controllers 디렉토리
      if (data.withController) {
        actions.push({
          type: 'add',
          path: `${modulePath}/controllers/.gitkeep`,
          template: '',
        });
        actions.push({
          type: 'add',
          path: `${modulePath}/controllers/user/.gitkeep`,
          template: '',
        });
        actions.push({
          type: 'add',
          path: `${modulePath}/controllers/admin/.gitkeep`,
          template: '',
        });
      }

      // 기존 파일 생성 코드 (주석처리)
      /*
      // Domain - Index
      actions.push({
        type: 'add',
        path: `${modulePath}/domain/index.ts`,
        templateFile: 'plop-templates/domain/index.ts.hbs',
        data: { parentPath: parentPath },
      });

      // Domain - Entity
      if (data.withEntity) {
        actions.push({
          type: 'add',
          path: `${modulePath}/domain/model/{{kebabCase moduleName}}.entity.ts`,
          templateFile: 'plop-templates/domain/entity.ts.hbs',
          data: { parentPath: parentPath },
        });
      }

      // Domain - Policy
      if (data.withPolicy) {
        actions.push({
          type: 'add',
          path: `${modulePath}/domain/{{kebabCase moduleName}}-policy.ts`,
          templateFile: 'plop-templates/domain/policy.ts.hbs',
          data: { parentPath: parentPath },
        });
      }

      // Domain - Exception
      if (data.withException) {
        actions.push({
          type: 'add',
          path: `${modulePath}/domain/{{kebabCase moduleName}}.exception.ts`,
          templateFile: 'plop-templates/domain/exception.ts.hbs',
          data: { parentPath: parentPath },
        });
      }

      // Ports - Out (Repository Port)
      if (data.withRepository) {
        actions.push({
          type: 'add',
          path: `${modulePath}/ports/out/{{kebabCase moduleName}}.repository.port.ts`,
          templateFile: 'plop-templates/ports/repository.port.ts.hbs',
          data: { parentPath: parentPath },
        });
        actions.push({
          type: 'add',
          path: `${modulePath}/ports/out/{{kebabCase moduleName}}.repository.token.ts`,
          templateFile: 'plop-templates/ports/repository.token.ts.hbs',
          data: { parentPath: parentPath },
        });
      }

      // Infrastructure - Repository
      if (data.withRepository) {
        actions.push({
          type: 'add',
          path: `${modulePath}/infrastructure/{{kebabCase moduleName}}.repository.ts`,
          templateFile: 'plop-templates/infrastructure/repository.ts.hbs',
          data: { parentPath: parentPath },
        });
      }

      // Infrastructure - Mapper
      if (data.withMapper) {
        actions.push({
          type: 'add',
          path: `${modulePath}/infrastructure/{{kebabCase moduleName}}.mapper.ts`,
          templateFile: 'plop-templates/infrastructure/mapper.ts.hbs',
          data: { parentPath: parentPath },
        });
      }

      // Application - Service
      if (data.withService) {
        actions.push({
          type: 'add',
          path: `${modulePath}/application/create-{{kebabCase moduleName}}.service.ts`,
          templateFile: 'plop-templates/application/service.ts.hbs',
          data: { parentPath: parentPath, modulePath: parentPath ? `${parentPath}/{{kebabCase moduleName}}` : '{{kebabCase moduleName}}' },
        });
      }

      // Controller
      if (data.withController) {
        actions.push({
          type: 'add',
          path: `${modulePath}/controllers/{{kebabCase moduleName}}.controller.ts`,
          templateFile: 'plop-templates/controller/controller.ts.hbs',
          data: { parentPath: parentPath },
        });
      }
      */

      return actions;
    },
  });

  // Generator: Application Service 생성
  plop.setGenerator('service', {
    description: 'Application Service 생성',
    prompts: [
      {
        type: 'input',
        name: 'serviceName',
        message: 'Service 이름을 입력하세요 (예: create-user, find-user-by-id):',
        validate: (value) => {
          if (!value) return 'Service 이름은 필수입니다';
          return true;
        },
      },
      {
        type: 'input',
        name: 'modulePath',
        message: '모듈 경로를 입력하세요 (예: affiliate/referral, auth/credential):',
        validate: (value) => {
          if (!value) return '모듈 경로는 필수입니다';
          return true;
        },
      },
    ],
    actions: [
      // 디렉토리 구조만 생성
      // 주의: test 폴더는 생성하지 않음
      {
        type: 'add',
        path: 'src/modules/{{modulePath}}/application/.gitkeep',
        template: '',
      },
      // 기존 파일 생성 코드 (주석처리)
      /*
      {
        type: 'add',
        path: 'src/modules/{{modulePath}}/application/{{kebabCase serviceName}}.service.ts',
        templateFile: 'plop-templates/application/service.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{modulePath}}/application/{{kebabCase serviceName}}.service.spec.ts',
        templateFile: 'plop-templates/application/service.spec.ts.hbs',
      },
      */
    ],
  });

  // Generator: Controller 생성
  plop.setGenerator('controller', {
    description: 'Controller 생성',
    prompts: [
      {
        type: 'input',
        name: 'controllerName',
        message: 'Controller 이름을 입력하세요 (예: user, admin-user):',
        validate: (value) => {
          if (!value) return 'Controller 이름은 필수입니다';
          return true;
        },
      },
      {
        type: 'input',
        name: 'modulePath',
        message: '모듈 경로를 입력하세요 (예: affiliate/referral, auth/credential):',
        validate: (value) => {
          if (!value) return '모듈 경로는 필수입니다';
          return true;
        },
      },
      {
        type: 'list',
        name: 'controllerType',
        message: 'Controller 타입을 선택하세요:',
        choices: ['user', 'admin', 'both'],
        default: 'user',
      },
    ],
    actions: (data) => {
      const actions = [];
      const basePath = `src/modules/${data.modulePath}/controllers`;

      // 디렉토리 구조만 생성
      // 주의: test 폴더는 생성하지 않음
      actions.push({
        type: 'add',
        path: `${basePath}/.gitkeep`,
        template: '',
      });

      if (data.controllerType === 'user' || data.controllerType === 'both') {
        actions.push({
          type: 'add',
          path: `${basePath}/user/.gitkeep`,
          template: '',
        });
      }

      if (data.controllerType === 'admin' || data.controllerType === 'both') {
        actions.push({
          type: 'add',
          path: `${basePath}/admin/.gitkeep`,
          template: '',
        });
      }

      // 기존 파일 생성 코드 (주석처리)
      /*
      if (data.controllerType === 'user' || data.controllerType === 'both') {
        actions.push({
          type: 'add',
          path: `${basePath}/user/{{kebabCase controllerName}}.controller.ts`,
          templateFile: 'plop-templates/controller/user-controller.ts.hbs',
        });
        actions.push({
          type: 'add',
          path: `${basePath}/user/{{kebabCase controllerName}}.controller.spec.ts`,
          templateFile: 'plop-templates/controller/controller.spec.ts.hbs',
        });
      }

      if (data.controllerType === 'admin' || data.controllerType === 'both') {
        actions.push({
          type: 'add',
          path: `${basePath}/admin/{{kebabCase controllerName}}.controller.ts`,
          templateFile: 'plop-templates/controller/admin-controller.ts.hbs',
        });
        actions.push({
          type: 'add',
          path: `${basePath}/admin/{{kebabCase controllerName}}.controller.spec.ts`,
          templateFile: 'plop-templates/controller/controller.spec.ts.hbs',
        });
      }
      */

      return actions;
    },
  });

  // Generator: Domain Entity 생성
  plop.setGenerator('entity', {
    description: 'Domain Entity 생성',
    prompts: [
      {
        type: 'input',
        name: 'entityName',
        message: 'Entity 이름을 입력하세요 (예: user, order):',
        validate: (value) => {
          if (!value) return 'Entity 이름은 필수입니다';
          return true;
        },
      },
      {
        type: 'input',
        name: 'modulePath',
        message: '모듈 경로를 입력하세요 (예: affiliate/referral, auth/credential):',
        validate: (value) => {
          if (!value) return '모듈 경로는 필수입니다';
          return true;
        },
      },
    ],
    actions: [
      // 디렉토리 구조만 생성
      // 주의: test 폴더는 생성하지 않음
      {
        type: 'add',
        path: 'src/modules/{{modulePath}}/domain/.gitkeep',
        template: '',
      },
      {
        type: 'add',
        path: 'src/modules/{{modulePath}}/domain/model/.gitkeep',
        template: '',
      },
      // 기존 파일 생성 코드 (주석처리)
      /*
      {
        type: 'add',
        path: 'src/modules/{{modulePath}}/domain/model/{{kebabCase entityName}}.entity.ts',
        templateFile: 'plop-templates/domain/entity.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/modules/{{modulePath}}/domain/model/{{kebabCase entityName}}.entity.spec.ts',
        templateFile: 'plop-templates/domain/entity.spec.ts.hbs',
      },
      */
    ],
  });
};

