
let cardIds = [];
let totalCards = 0;
let cardsByPage = 200;

const searchDisplay = {
    show : "flex",
    hide : "none"
};

let races = [];
let types = [];

const mainAPI = "https://db.ygoprodeck.com/api/v7/cardinfo.php";

async function fetchAllCards(filter) {

    try {

        var url = mainAPI + filter;

        // Faz a requisição para a API
        const response = await fetch(url);

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

    card.style.order = index;

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
function getCardList(filter = '')
{
    fetchAllCards(filter).then(cards => {
        if (cards) {
            // Mapeia os cards para armazenar um objeto com o índice e o ID
            cardIds = cards.map((card, index) => ({
                index: index,  // O índice começa de 0 e aumenta à medida que os cards são inseridos
                id: card.id    // O ID da carta
            }));
    
            // Adiciona a raça se ainda não existir na lista de raças
            cards.forEach(card => {
                if (!races.includes(card.race) && card.race) {
                    races.push(card.race);
                }
                
                // Adiciona o tipo se ainda não existir na lista de tipos
                if (!types.includes(card.type) && card.type) {
                    types.push(card.type);
                }
            });
    
            createPageSelect();
            createTypeSelect();
            createRaceSelect();
            searchCard();
            // Chama displayCards somente após cardIds estar preenchido
            displayCards();
        }
    });
}

getCardList();

function createPageSelect()
{
    var pageSelect = document.getElementById('pageTable');
    var maxPages = Math.ceil(totalCards/cardsByPage);

    // Remove todas as opções existentes do select
    pageSelect.innerHTML = '';

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

function createTypeSelect(){
    
    var typeSelect = document.getElementById('pageType');

    typeSelect.innerHTML = '';

    var generalOption = document.createElement('option');
    generalOption.textContent = 'All';
    generalOption.value = 'All';
    typeSelect.appendChild(generalOption);

    types.forEach(type => {
        var actualOption = type;
        var option = document.createElement('option');
        option.textContent = actualOption;
        option.value = actualOption;
        typeSelect.appendChild(option);
    })
}

function createRaceSelect(){

    var raceSelect = document.getElementById('pageRace');

    raceSelect.innerHTML = '';

    var generalOption = document.createElement('option');
    generalOption.textContent = 'All';
    generalOption.value = 'All';
    raceSelect.appendChild(generalOption);

    races.forEach(race => {
        var actualOption = race;
        var option = document.createElement('option');
        option.textContent = actualOption;
        option.value = actualOption;
        raceSelect.appendChild(option);
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

function completeAdvancedSearch() {
    removeCards();

    var typeSelect = document.getElementById('pageType');
    var raceSelect = document.getElementById('pageRace');

    // Inicializa o filtro vazio
    var filter = [];

    // Adiciona o tipo ao filtro, caso não seja "All"
    if (typeSelect.value !== 'All') 
        filter.push(`type=${typeSelect.value}`);

    // Adiciona a raça ao filtro, caso não seja "All"
    if (raceSelect.value !== 'All') 
        filter.push(`race=${raceSelect.value}`);

    // Combina os parâmetros do filtro usando '&'
    var filterQuery = filter.length > 0 ? `?${filter.join('&')}` : '';

    // Chama a função para buscar as cartas com o filtro
    getCardList(filterQuery);
}


var completeSearchButton = document.getElementById('completeSearch');
completeSearchButton.addEventListener('click', function (){
    completeAdvancedSearch();
})