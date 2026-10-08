/* Exceções da API — equivalentes ao pacote com.buspoint.exception */

// 404 — RecursoNaoEncontradoException
export class RecursoNaoEncontradoException extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'RecursoNaoEncontradoException';
  }
}

// 400 — RegraNegocioException
export class RegraNegocioException extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'RegraNegocioException';
  }
}

// 400 — MethodArgumentNotValidException (validação de campos)
export class ValidacaoException extends Error {
  constructor(campos) {
    super('Dados inválidos');
    this.name = 'ValidacaoException';
    this.campos = campos;
  }
}

// 409 — DataIntegrityViolationException
export class ConflitoException extends Error {
  constructor(mensagem = 'Os dados conflitam com um registro ou uma restricao do banco') {
    super(mensagem);
    this.name = 'ConflitoException';
  }
}

// 401 / 403 — autenticação e autorização
export class NaoAutenticadoException extends Error {
  constructor(mensagem = 'Faça login para continuar.') {
    super(mensagem);
    this.name = 'NaoAutenticadoException';
  }
}

export class AcessoNegadoException extends Error {
  constructor(mensagem = 'Você não possui permissão para esta operação.') {
    super(mensagem);
    this.name = 'AcessoNegadoException';
  }
}
