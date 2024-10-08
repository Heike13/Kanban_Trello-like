import Sortable from 'sortablejs';
import { addEventsToList, hideModals } from '../utils.module.js';
import {
    createList,
    deleteList,
    getListsFromAPI,
    updateList,
} from './api.lists.module.js';
import { makeCardInDOM, showAddCardModal } from '../cards/card.module.js';

async function getLists() {
    try {
        const data = await getListsFromAPI();

        for (const list of data) {
            makeListInDOM(list);

            for (const card of list.cards) {
                makeCardInDOM(card);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

function handleAddListForm() {
    const addListForm = document.querySelector('#addListModal form');

    addListForm.addEventListener('submit', async event => {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(event.target));
        try {
            const list = await createList(data);

            makeListInDOM(list);

            event.target.reset();
        } catch (e) {
            console.log(e);
        }
    });
}

function showAddListModal() {
    document.getElementById('addListModal').classList.add('is-active');
}

function makeListInDOM(data) {
    const listTemplate = document.getElementById('list-template');
    const clone = document.importNode(listTemplate.content, true);

    clone.querySelector('[slot="title"]').textContent = data.title;

    clone.querySelector('.panel').setAttribute('data-list-id', data.id);

    const deleteBtn = clone.querySelector('.panel a');
    deleteBtn.addEventListener('click', destroyList);

    const addCardBtn = clone.querySelector('.panel a.is-pulled-right');
    addCardBtn.addEventListener('click', showAddCardModal);

    document.querySelector('.card-lists').appendChild(clone);
    addEventsToList();
    hideModals();
}

function showEditListForm(event) {
    const titleElement = event.target;

    const form = titleElement.nextElementSibling;
    form.classList.remove('is-hidden');
    form.querySelector('input[type=hidden]').value = titleElement
        .closest('.panel')
        .getAttribute('data-list-id');
}

async function editList(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);

    const dataObj = {
        title: data.get('title'),
    };

    try {
        const newList = await updateList(data.get('list-id'), dataObj);

        const titleElement = form.previousElementSibling;
        titleElement.textContent = newList.title;
        titleElement.classList.remove('is-hidden');
        form.classList.add('is-hidden');
        form.reset();
    } catch (e) {
        console.log(e);
    }
}

async function destroyList(event) {
    if (confirm('Etes vous sûr de vouloir effacer cette liste ?')) {
        event.preventDefault();

        const listId = event.target
            .closest('.panel')
            .getAttribute('data-list-id');

        try {
            const res = await deleteList(listId);
            if (res.message) {
                event.target.closest('.panel').remove();
            }
        } catch (e) {
            console.log(e);
        }
    }
}

function dragNDropList() {
    const listsContainer = document.querySelector('#lists-container');

    Sortable.create(listsContainer, {
        animation: 1000,
        onEnd: () => {

            const lists = document.querySelectorAll('#lists-container .panel');

            lists.forEach(async (list, index) => {
                const listId = list.getAttribute('data-list-id');
                const position = index + 1;
                try {
                    await updateList(listId, {
                        position: position,
                    });
                } catch (e) {
                    console.log(e);
                }
            });
        },
    });
}

export {
    handleAddListForm,
    showAddListModal,
    showEditListForm,
    editList,
    getLists,
    dragNDropList,
};
