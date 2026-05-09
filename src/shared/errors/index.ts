export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class PermissionError extends AppError {
  constructor(message = "권한이 없습니다") {
    super(message, "PERMISSION_DENIED");
  }
}

export class NotFoundError extends AppError{
    constructor(resource : string){
        super(`${resource}를 찾을 수 없습니다.`, 'NOT_FOUND');
    }
}

export class ValidationError extends AppError{
    constructor(message : string){
        super(message, 'VALIDATION_ERROR');
    }
}

export class ExternalAPIError extends AppError{
    constructor(message = '외부 API 오류'){
        super(message,'EXTERNAL_API_ERROR');
    }
}

export class DuplicateError extends AppError{
    constructor(resource : string){
        super(resource,'DUPLICATE');
    }
}

export class UnregisterError extends AppError {
    constructor() {
        super('회원 가입이 필요합니다. /회원가입 으로 먼저 가입해주세요','UNREGISTERED');
    }
}