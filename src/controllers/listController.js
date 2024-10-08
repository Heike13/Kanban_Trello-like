import { List } from '../models/index.js';
import sanitize from 'sanitize-html';
import Joi from 'joi';

const listController = {
    /** SHOW is a RESTful method
     *  action : find a list with its cards and tags
     */
    async show(req, res) {
        try {
            // get the id from the URL and convert it to an integer
            // (the second argument of parseInt is the radix, 10 for decimal)
            const listId = Number.parseInt(req.params.id, 10);
            const list = await List.findByPk(listId, {
                include: {
                    association: 'cards',
                    include: 'tags',
                },
            });
            if (!list) {
                return res.status(404).json({ error: 'List not found' });
            }

            return res.json(list);
        } catch (error) {
            console.error('Error when fetching list', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    /** INDEX is a RESTful method
     * find all lists with their cards and tags
     */
    async index(req, res) {
        const lists = await List.findAll({
            include: {
                association: 'cards',
                include: 'tags',
            },

            order: [
                ['position', 'ASC'],
                ['created_at', 'DESC'],
            ],
        });
        res.json(lists);
    },

    /** STORE is a RESTful method
     * create a new list
     */
    async store(req, res) {
        let { title, position } = req.body;

        if (!title || typeof title !== 'string') {
            return res
                .status(400)
                .json({ error: 'Le paramètre title est invalide' });
        }

        if (isDefinedButNotInt(position)) {
            return res
                .status(400)
                .json({ error: 'Le paramètre position est invalide' });
        }

        title = sanitize(req.body.title);
        const newList = await List.create({ title, position });
        res.json(newList);
    },

    /** UPDATE is a RESTful method
     * update a list with its cards and tags
     */
    async update(req, res) {
        const { id } = req.params;
        const { title, position } = req.body;

        const schema = Joi.object({
            title: Joi.string().min(1),
            position: Joi.number().integer().greater(0),
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const listToUpdate = await List.findByPk(id);

        if (!listToUpdate) {
            return res.status(404).json({ error: "La liste n'existe pas" });
        }
        const updatedList = await listToUpdate.update({
            title: title || listToUpdate.title,
            position: position || listToUpdate.position,
        });

        return res.json(updatedList);
    },

    /** DESTROY is a RESTful method
     * delete a list with its cards and tags
     */
    async destroy(req, res) {
        const id = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(id)) {
            return res.status(204).json({ error: "La ressource n'existe pas" });
        }

        const list = await List.findByPk(id);

        if (!list) {
            return res.status(204).json({ error: "La ressource n'existe pas" });
        }

        await list.destroy();

        return res.json({ message: 'La ressource a été effacé' });
    },
};

/**
 * This fonction check if value is defined and not an integer
 * @param {int} value
 * @returns Boolean
 */
function isDefinedButNotInt(value) {
    // value has to be defined, integer and greater than 0
    return value !== undefined && (!Number.isInteger(value) || value <= 0);
}

export { listController };
