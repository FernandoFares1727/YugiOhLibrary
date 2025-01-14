
let cardIds = [];
let totalCards = 0;
let cardsByPage = 1000;

const searchDisplay = {
    show : "flex",
    hide : "none"
};

const mainAPI = "https://db.ygoprodeck.com/api/v7/cardinfo.php";

async function fetchAllCards() {

    try {
        // Faz a requisição para a API
        const response = await fetch(mainAPI);

        // Verifica se a resposta é válida
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados: ${response.statusText}`);
        }

        // Converte a resposta em JSON
        const data = await response.json();

        // Verifica se o resultado contém o array de cartas
        if (data && data.data) {
            const allCards = data.data; // Todas as cartas
            totalCards = allCards.length;

            // Exemplo de processamento ou armazenamento
            // Aqui armazenamos as cartas em uma variável global ou local
            return allCards;
        } else {
            throw new Error("Resposta inesperada da API");
        }
    } catch (error) {
        console.error("Erro ao buscar cartas:", error);
        return null;
    }
}

// Função para organizar os IDs em ordem crescente
function sortCardIds(ids) {
    return ids.sort((a, b) => a - b);
}

async function displayCards(page = 1) {
    // Criação da barra de progresso
    var progressBar = document.createElement('div');
    progressBar.classList.add('loader');
    document.body.appendChild(progressBar);

    try {
        console.log(page);

        // Calcular o intervalo mínimo e máximo de cards com base na página atual
        const minInterval = (page - 1) * cardsByPage; // Posição do primeiro card
        const maxInterval = page * cardsByPage; // Posição do último card

        // Filtra os cards para pegar apenas os que pertencem à página solicitada
        const cardsToDisplay = cardIds.slice(minInterval, maxInterval);

        // Criar um array para armazenar as promessas
        const promises = cardsToDisplay.map(async (cardData) => {
            // Faz a requisição para a API
            const response = await fetch(`${mainAPI}?id=${cardData.id}`);

            // Verifica se a resposta é válida
            if (!response.ok) {
                throw new Error(`Erro ao buscar dados: ${response.statusText}`);
            }

            const data = await response.json();
            if (data && data.data && data.data.length > 0) {
                createYugiCard(data.data[0], cardData.index); // Envia a primeira carta e o índice para renderizar
            } else {
                console.warn(`Nenhum dado encontrado para o ID: ${cardData.id}`);
            }
        });

        // Aguarda todas as promessas
        await Promise.all(promises);

    } catch (error) {
        console.error("Erro ao buscar cartas:", error);
    }

    // Remove a barra de progresso após as requisições
    document.body.removeChild(progressBar);
}

function createYugiCard(yugiCard, index) {
    const cardList = document.getElementById('cardList'); // Elemento para listar as cartas

    // Cria a imagem da carta
    const card = document.createElement('img');
    card.src = yugiCard.card_images[0]?.image_url || ''; // Garante que pega o primeiro URL de imagem
    card.alt = yugiCard.name; // Nome da carta como texto alternativo
    card.id = yugiCard.id; // Define o ID da carta
    card.className = 'card'; // Adiciona uma classe para estilos

    // Armazena o índice da carta no atributo data-index
    card.setAttribute('data-index', index);

    // Adiciona evento de clique para exibir em modal
    card.addEventListener('click', () => showCardInModal(card));

    // Adiciona a imagem ao contêiner
    cardList.appendChild(card);
}

function showCardInModal(card) {
    const modal = document.getElementById('cardModal');
    const modalImg = document.getElementById('modalImage');

    modalImg.src = card.src; // Define o src da imagem no modal
    modalImg.alt = card.alt; // Define o alt da imagem no modal

    modal.style.display = 'flex'; // Exibe o modal
}

// Fecha o modal ao clicar fora da imagem
document.getElementById('cardModal').addEventListener('click', () => {
    const modal = document.getElementById('cardModal');
    modal.style.display = 'none';
});

// Chama fetchAllCards e, quando concluído, preenche os IDs e chama displayCards
fetchAllCards().then(cards => {
    if (cards) {
        // Mapeia os cards para armazenar um objeto com o índice e o ID
        cardIds = cards.map((card, index) => ({
            index: index,  // O índice começa de 0 e aumenta à medida que os cards são inseridos
            id: card.id    // O ID da carta
        }));

        createPageSelect();
        searchCard();
        // Chama displayCards somente após cardIds estar preenchido
        displayCards();
    }
});

function createPageSelect()
{
    var pageSelect = document.querySelector('#page');
    var maxPages = Math.ceil(totalCards/cardsByPage);

    for (let i = 0; i < maxPages; i++)
        {
            var actualOption = i + 1;
            var option = document.createElement('option');
            option.textContent = actualOption;
            option.value = actualOption;
            pageSelect.appendChild(option);
        }
    
    pageSelect.addEventListener('change', function (event) {
        clearSearchInput();

        var selectedPage = event.target.value;
        removeCards();
        displayCards(selectedPage);
    })
}

function removeCards()
{
    var cardList = document.querySelector('#cardList');
    var cards = cardList.querySelectorAll('img');

    cards.forEach(card => {
        cardList.removeChild(card);
    })
}

function clearSearchInput()
{
    var searchInput = document.querySelector('#search').querySelector('input');
    searchInput.value = "";
}

function searchCard(){
    var searchInput = document.querySelector('#search').querySelector('input');

    searchInput.addEventListener("input", function() {
        var valueInput = searchInput.value.trim().toLowerCase();

        console.log(valueInput);

        if (valueInput == '')
        {
            showAllCards();
            return;
        }

        var cardList = document.getElementById('cardList');
        var cards = cardList.querySelectorAll('img');

        valueInput = valueInput
        cards.forEach(card => {
            const cardName = card.alt.toLowerCase();
            const isVisible = cardName.includes(valueInput);
            card.style.display = isVisible ? searchDisplay.show : searchDisplay.hide;
        })
    })
}

function showAllCards()
{
    var cardList = document.getElementById('cardList');
    var cards = cardList.querySelectorAll('img');

    cards.forEach(card => {
        card.style.display = searchDisplay.show;
    })
}