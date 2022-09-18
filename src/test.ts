import Parser from './parser.class';
import * as assert from 'assert';

type Row = {
	name: string;
	age: number;
	contact: {
		email: string;
		phone: string;
	};
	hobbies?: string[];
};

describe('When transforming an data to a csv', () => {
	let data: Row[];
	beforeEach(
		() =>
			(data = [
				{
					name: 'John',
					age: 30,
					contact: {
						email: 'test@test.com',
						phone: '1234567890',
					},
				},
				{
					name: 'John',
					age: 30,
					contact: {
						email: 'test@test.com',
						phone: '1234567890',
					},
				},
			]),
	);
	it('should parse the data to a valid csv', async () => {
		const csv = await Parser.parse<Row>(data, { headers: ['name', 'age', 'contact'] });
		assert.strictEqual(
			csv,
			'name,age,contact\nJohn,30,{"email":"test@test.com","phone":"1234567890"}\nJohn,30,{"email":"test@test.com","phone":"1234567890"}\n',
		);
	});
	describe('and a transforms option is provided', () => {
		const transform = (contact: Row['contact']) => `${contact.email} - ${contact.phone}`;
		it('should parse the data to a valid csv', async () => {
			const csv = await Parser.parse<Row>(data, {
				headers: ['name', 'age', 'contact'],
				transforms: { contact: transform },
			});
			assert.strictEqual(
				csv,
				`name,age,contact\nJohn,30,${transform(data[0].contact)}\nJohn,30,${transform(data[0].contact)}\n`,
			);
		});
	});
	describe('and a defaultValue option is provided', () => {
		const defaultValue = '<empty>';
		it('should parse the data to a valid csv', async () => {
			const csv = await Parser.parse<Row>(data, { headers: ['name', 'age', 'contact', 'hobbies'], defaultValue });
			assert.strictEqual(
				csv,
				'name,age,contact,hobbies\nJohn,30,{"email":"test@test.com","phone":"1234567890"},<empty>\nJohn,30,{"email":"test@test.com","phone":"1234567890"},<empty>\n',
			);
		});
	});
	describe('and a eol option is provided', () => {
		const eol = '\r\n';
		it('should parse the data to a valid csv', async () => {
			const csv = await Parser.parse<Row>(data, { headers: ['name', 'age', 'contact'], eol });
			assert.strictEqual(
				csv,
				'name,age,contact\r\nJohn,30,{"email":"test@test.com","phone":"1234567890"}\r\nJohn,30,{"email":"test@test.com","phone":"1234567890"}\r\n',
			);
		});
	});
	describe('and a delimiter option is provided', () => {
		const delimiter = ';';
		it('should parse the data to a valid csv', async () => {
			const csv = await Parser.parse<Row>(data, { headers: ['name', 'age', 'contact'], delimiter });
			assert.strictEqual(
				csv,
				'name;age;contact\nJohn;30;{"email":"test@test.com","phone":"1234567890"}\nJohn;30;{"email":"test@test.com","phone":"1234567890"}\n',
			);
		});
	});
});
