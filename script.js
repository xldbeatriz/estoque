let estoqueDentro = JSON.parse(localStorage.getItem('estoqueDentro'))||[];
let estoqueFora = JSON.parse(localStorage.getItem('estoqueFora'))||[];

const formDentro = document.getElementById('form-dentro');
const formFora = document.getElementById('form-fora');

formDentro.addEventListener('submit', function(e){
    e.preventDefault();

    const produto = {
        codigo: document.getElementById('codigo-dentro').value.trim(),
        nome: document.getElementById('nome-dentro').value.trim().toLowerCase(),
        quantidade: parseInt(document.getElementById('quantidade-dentro').value),
        validade: document.getElementById('validade-dentro').value
    };
    estoqueDentro.push(produto);
    localStorage.setItem('estoqueDentro',JSON.stringify(estoqueDentro));
    alert('Produto adicionado ao estoque de DENTRO');
    formDentro.reset();
    compararEstoques();
})

formFora.addEventListener('submit', function(e){
    e.preventDefault();

    const produto = {
        codigo: document.getElementById('codigo-fora').value.trim(),
        nome: document.getElementById('nome-fora').value.trim().toLowerCase(),
        quantidade: parseInt(document.getElementById('quantidade-fora').value),
        validade: document.getElementById('validade-fora').value
    };

    estoqueFora.push(produto);
    localStorage.setItem('estoqueFora',JSON.stringify(estoqueFora));
    alert('Produto adicionado ao estoque de FORA');
    formFora.reset();
    compararEstoques();
})

function diasParaVencer(dataValidade) {
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diff = validade - hoje;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)); // dias restantes
}

function getClasseValidade(dias) {
    if (dias <= 30) return 'vermelho';
    if (dias <= 60) return 'amarelo';
    return '';
}

function formatarProduto(produto, origem) {
    const dias = diasParaVencer(produto.validade);
    const classe = getClasseValidade(dias);
    const id = produto.codigo || produto.nome;

    return `<li class="${classe}">
        <strong>${produto.nome}</strong> | Código: ${produto.codigo || '---'} | 
        Qtde: ${produto.quantidade} | Validade: ${new Date(produto.validade).toLocaleDateString('pt-BR')}
        (${dias} dias restantes)
        <button onclick="editarProduto('${id}', '${origem}')">✏️ Editar</button>
        <button onclick="apagarProduto('${id}', '${origem}')">🗑 Apagar</button>

    </li>`;
}

let campoCodigoAtual = null;

function iniciarLeitor(idCampo) {
    const divLeitor = document.getElementById('leitor-codigo');
    campoCodigoAtual = document.getElementById(idCampo);
    divLeitor.style.display = "block";

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: divLeitor,
            constraints: {
                facingMode: "environment"
            },
        },
        decoder: {
            readers: ["ean_reader"]
        }
    }, function (err) {
        if (err) {
            console.error("Erro ao iniciar o Quagga:", err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function(result) {
        let codigo = result.codeResult.code;
        if (campoCodigoAtual) {
            campoCodigoAtual.value = codigo;
        }
        document.getElementById("codigo-lido").innerText = `Código lido: ${codigo}`;
        Quagga.stop();
        divLeitor.style.display = "none";
        Quagga.offDetected(); // evita múltiplas execuções
    });
}

function compararEstoques() {
    const ambos = [];
    const soDentro = [];
    const soFora = [];

    const codigosFora = estoqueFora.map(p => p.codigo || p.nome);
    const codigosDentro = estoqueDentro.map(p => p.codigo || p.nome);

    estoqueDentro.forEach(prodDentro => {
        const id = prodDentro.codigo || prodDentro.nome;
        const indexFora = codigosFora.indexOf(id);

        if (indexFora !== -1) {
            const prodFora = estoqueFora[indexFora];
            const quantidadeTotal = parseInt(prodDentro.quantidade) + parseInt(prodFora.quantidade);

            ambos.push({
                ...prodDentro,
                quantidade: quantidadeTotal
            });
        } else {
            soDentro.push(prodDentro);
        }
    });

    estoqueFora.forEach(prodFora => {
        const id = prodFora.codigo || prodFora.nome;
        if (!codigosDentro.includes(id)) {
            soFora.push(prodFora);
        }
    });
   

    exibirLista('ambos', ambos);
    exibirLista('so-dentro', soDentro);
    exibirLista('so-fora', soFora);
}

function exibirLista(id, lista) {
    const ul = document.querySelector(`#${id} ul`);
    ul.innerHTML = ''; // limpa lista anterior

    // ordena por validade mais próxima
    lista.sort((a, b) => new Date(a.validade) - new Date(b.validade));

    lista.forEach(prod => {
        const origem = id === 'so-dentro' ? 'estoqueDentro' :
                       id === 'so-fora' ? 'estoqueFora' : 'ambos'; // ambos: vamos apagar dos dois
        ul.innerHTML += formatarProduto(prod, origem);
    });
    
}

function apagarProduto(id, origem) {
    if (origem === 'estoqueDentro' || origem === 'ambos') {
        estoqueDentro = estoqueDentro.filter(p => (p.codigo || p.nome) !== id);
        localStorage.setItem('estoqueDentro', JSON.stringify(estoqueDentro));
    }

    if (origem === 'estoqueFora' || origem === 'ambos') {
        estoqueFora = estoqueFora.filter(p => (p.codigo || p.nome) !== id);
        localStorage.setItem('estoqueFora', JSON.stringify(estoqueFora));
    }

    alert('Produto removido com sucesso!');
    compararEstoques(); // atualiza a exibição
}


// chamar a função ao carregar
document.addEventListener('DOMContentLoaded', compararEstoques);



function editarProduto(id, origem) {
    const estoque = origem.includes('Dentro') ? estoqueDentro : estoqueFora;
    const form = origem.includes('Dentro') ? formDentro : formFora;
    const sufixo = origem.includes('Dentro') ? 'dentro' : 'fora';

    const index = estoque.findIndex(p => (p.codigo || p.nome) === id);
    if (index === -1) return alert("Produto não encontrado.");

    const produto = estoque[index];

    // Preenche os campos do formulário
    form.querySelector(`#codigo-${sufixo}`).value = produto.codigo;
    form.querySelector(`#nome-${sufixo}`).value = produto.nome;
    form.querySelector(`#quantidade-${sufixo}`).value = produto.quantidade;
    form.querySelector(`#validade-${sufixo}`).value = produto.validade;

    // Remove o produto do array temporariamente
    estoque.splice(index, 1);
    localStorage.setItem(
        origem.includes('Dentro') ? 'estoqueDentro' : 'estoqueFora',
        JSON.stringify(estoque)
    );

    compararEstoques();
}
