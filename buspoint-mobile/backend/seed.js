/* Dados de demonstração (os mesmos do protótipo), gerados com datas relativas a hoje.
   Senhas: admin123 (administrador), motorista123 (motoristas), aluno123 (alunos). */
import { hoje, somarDias } from './clock.js';

const H_ADMIN = '$2a$08$.nD3Jq0/FmQ/h9Y2PeNmNu9mtw0VAleeBnsTjuwk872fRBGSuu0bS';
const H_MOTORISTA = '$2a$08$zLTpy8BuYXVAlYmkkP6KOOUBbeXCuhKVu4O9lo5efdrNMY.iqxDyS';
const H_ALUNO = '$2a$08$tgzxMbX9cZpc.Asnku1xx.Ii3AljVDmgu2kiOuuiwamYdFgt2Ea1O';

export function criarDadosIniciais(versao) {
  const d0 = hoje();
  const t = {
    usuario: [], aluno: [], motorista: [], administrador: [],
    ponto_parada: [], rota: [], rota_ponto_parada: [], onibus: [],
    viagem: [], matricula: [], registro_transporte: [],
    rota_atribuicao: [], solicitacao_horario: [],
  };
  const seq = {};
  const id = (tab) => { seq[tab] = (seq[tab] || 0) + 1; return seq[tab]; };

  const usuario = (nome, email, tel, login, hash, status = true) => {
    const u = { idUsuario: id('usuario'), nomeUsuario: nome, emailUsuario: email, telefoneUsuario: tel, loginUsuario: login, senhaUsuario: hash, statusUsuario: status, fotoUsuario: null };
    t.usuario.push(u);
    return u.idUsuario;
  };

  // Administrador
  t.administrador.push({ idUsuario: usuario('Administrador BusPoint', 'admin@buspoint.com.br', '11987001000', 'admin', H_ADMIN) });

  // Motoristas
  const motorista = (nome, email, tel, login, cnh, cat, val) => {
    const idU = usuario(nome, email, tel, login, H_MOTORISTA);
    t.motorista.push({ idUsuario: idU, numeroCnh: cnh, categoriaCnh: cat, validadeCnh: val });
    return idU;
  };
  const carlos = motorista('Carlos Mendes', 'carlos.mendes@buspoint.com.br', '11987432201', 'carlos.mendes', '04821756390', 'D', '2028-08-18');
  const roberto = motorista('Roberto Almeida', 'roberto.almeida@buspoint.com.br', '11981145700', 'roberto.almeida', '05731482601', 'D', '2029-04-23');
  const fernanda = motorista('Fernanda Ribeiro', 'fernanda.ribeiro@buspoint.com.br', '11994816072', 'fernanda.ribeiro', '06628451377', 'D', '2027-11-09');

  // Alunos
  const aluno = (nome, email, tel, login, mat, periodo, status = true) => {
    const idU = usuario(nome, email, tel, login, H_ALUNO, status);
    t.aluno.push({ idUsuario: idU, numeroMatricula: mat, periodo, statusMatricula: true });
    return idU;
  };
  const joao = aluno('João Silva', 'joao.silva@aluno.edu.br', '11988421550', 'joao.silva', 202600184, 'Manhã');
  const maria = aluno('Maria Souza', 'maria.souza@aluno.edu.br', '11985128024', 'maria.souza', 202600217, 'Manhã');
  const ana = aluno('Ana Beatriz Costa', 'ana.costa@aluno.edu.br', '11980454368', 'ana.costa', 202600328, 'Manhã');
  const pedro = aluno('Pedro Henrique Lima', 'pedro.lima@aluno.edu.br', '11982716029', 'pedro.lima', 202600419, 'Tarde');
  const luiza = aluno('Luiza Oliveira', 'luiza.oliveira@aluno.edu.br', '11984127310', 'luiza.oliveira', 202600526, 'Manhã');
  const gabriel = aluno('Gabriel Santos', 'gabriel.santos@aluno.edu.br', '11989931020', 'gabriel.santos', 202600633, 'Tarde', false);

  // Ônibus
  const onibus = (placa, cap, status = true) => {
    const o = { idOnibus: id('onibus'), placaOnibus: placa, capacidadeOnibus: cap, statusOnibus: status };
    t.onibus.push(o);
    return o.idOnibus;
  };
  const abc = onibus('ABC-1234', 42);
  const def = onibus('DEF-5678', 38);
  const ghi = onibus('GHI-9012', 44);
  onibus('JKL-3456', 40, false);

  // Pontos de parada
  const ponto = (nome, endereco, lat, lng) => {
    const p = { idPonto: id('ponto_parada'), nomePonto: nome, endereco, latitude: lat, longitude: lng };
    t.ponto_parada.push(p);
    return p.idPonto;
  };
  const garagem = ponto('Garagem Municipal', 'Rua da Garagem, 100', -23.5505, -46.6333);
  const flores = ponto('Rua das Flores', 'Rua das Flores, 210', -23.5489, -46.6388);
  const brasil = ponto('Av. Brasil', 'Av. Brasil, 1500', -23.5462, -46.6421);
  const praca = ponto('Praça Central', 'Praça Central, s/n', -23.5431, -46.6457);
  const etec = ponto('ETEC Central', 'Av. da Educação, 800', -23.5408, -46.6492);
  const aurora = ponto('Rua Aurora', 'Rua Aurora, 45', -23.5523, -46.6301);
  const centroEdu = ponto('Centro Educacional', 'Rua do Saber, 300', -23.5551, -46.6272);
  const indep = ponto('Av. Independência', 'Av. Independência, 990', -23.5302, -46.6355);
  const escolaNorte = ponto('Escola Norte', 'Rua Norte, 12', -23.5251, -46.6310);

  // Rotas
  const rota = (nome, ini, fim, tipo, pontos) => {
    const r = { idRota: id('rota'), nomeRota: nome, horarioInicio: ini, horarioFim: fim, statusRota: true, tipo };
    t.rota.push(r);
    pontos.forEach((idPonto, i) => t.rota_ponto_parada.push({ idRota: r.idRota, idPonto, ordem: i + 1 }));
    return r.idRota;
  };
  const rEtec = rota('Rota ETEC', '06:30', '12:10', 'Ida e volta', [garagem, flores, brasil, praca, etec]);
  const rCentro = rota('Rota Centro', '12:30', '18:20', 'Ida e volta', [garagem, aurora, centroEdu]);
  const rNorte = rota('Rota Norte', '06:45', '12:15', 'Ida e volta', [garagem, indep, escolaNorte]);

  // Vínculo padrão rota → motorista / ônibus (extensão)
  t.rota_atribuicao.push(
    { idRota: rEtec, idMotorista: carlos, idOnibus: abc },
    { idRota: rCentro, idMotorista: roberto, idOnibus: def },
    { idRota: rNorte, idMotorista: fernanda, idOnibus: ghi },
  );

  // Matrículas (aluno ↔ rota) com ponto de embarque (extensão)
  const matricula = (idAluno, idRota, idPonto, data, status = true) => t.matricula.push({ idMatricula: id('matricula'), idAluno, idRota, statusMatricula: status, dataMatricula: data, idPontoEmbarque: idPonto });
  const inicioAno = `${d0.slice(0, 4)}-02-02`;
  matricula(joao, rEtec, flores, inicioAno);
  matricula(maria, rEtec, brasil, inicioAno);
  matricula(ana, rEtec, praca, inicioAno);
  matricula(pedro, rCentro, aurora, inicioAno);
  matricula(luiza, rEtec, flores, somarDias(d0, -1));
  matricula(gabriel, rNorte, indep, inicioAno, false);

  // Viagens
  const viagem = (data, ini, fim, status, idRota, idMotorista, idOnibus, obs = null) => {
    const v = { idViagem: id('viagem'), dataViagem: data, horaInicio: ini, horaFim: fim, status, observacaoFinalizacao: obs, idRota, idMotorista, idOnibus };
    t.viagem.push(v);
    return v.idViagem;
  };
  const registro = (idAluno, idViagem, tipo, dataHora) => t.registro_transporte.push({ idAluno, idViagem, tipoRegistro: tipo, dataHora, justificativa: null, status: true });

  // Histórico (viagens finalizadas em dias anteriores)
  const historico = [[-4, '06:31', '12:08'], [-3, '06:30', '12:12'], [-1, '06:30', '12:10']];
  for (const [dias, ini, fim] of historico) {
    const dia = somarDias(d0, dias);
    const v = viagem(dia, ini, fim, 'FINALIZADA', rEtec, carlos, abc);
    [[joao, '06:42', '07:20'], [maria, '06:47', '07:20'], [ana, '06:52', '07:20']].forEach(([a, e, s]) => {
      registro(a, v, 'EMBARQUE', `${dia}T${e}:00`);
      registro(a, v, 'DESEMBARQUE', `${dia}T${s}:00`);
    });
  }
  const vNorteOntem = viagem(somarDias(d0, -1), '06:45', '12:15', 'FINALIZADA', rNorte, fernanda, ghi);
  void vNorteOntem;

  // Viagens de hoje
  viagem(d0, '06:30', null, 'PENDENTE', rEtec, carlos, abc);
  viagem(d0, '06:45', '12:15', 'FINALIZADA', rNorte, fernanda, ghi);
  viagem(d0, '12:30', null, 'PENDENTE', rCentro, roberto, def);
  // Próximo dia útil já programado
  viagem(somarDias(d0, 1), '06:30', null, 'PENDENTE', rEtec, carlos, abc);

  return { versao, tabelas: t, sequencias: seq, sessoes: {}, redefinicoes: {} };
}
