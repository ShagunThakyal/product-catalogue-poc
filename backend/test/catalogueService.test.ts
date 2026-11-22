import { describe, expect, it } from 'vitest';
import { CatalogueService } from '../src/catalogue/catalogueService.js';
import { StubSource } from './fixtures.js';

const make = (featuredIds: string[] = []) =>
  new CatalogueService(new StubSource(), { featuredIds, featuredCount: 5, categoryTopCount: 2 });

describe('CatalogueService.featured', () => {
  it('returns the 5 hand-picked products in the chosen order', async () => {
    const result = await make(['7', '2', '5', '1', '3']).featured();
    expect(result.map((p) => p.id)).toEqual(['7', '2', '5', '1', '3']);
  });

  it('ignores unknown ids', async () => {
    const result = await make(['999', '5']).featured();
    expect(result.map((p) => p.id)).toEqual(['5']);
  });

  it('falls back to the 5 highest rated when nothing is configured', async () => {
    const result = await make().featured();
    expect(result.map((p) => p.id)).toEqual(['5', '1', '3', '7', '8']);
  });
});

describe('CatalogueService.category', () => {
  it('splits a category into top rated and the rest, sorted by rating', async () => {
    const view = await make().category('electronics');
    expect(view?.topRated.map((p) => p.id)).toEqual(['1', '3']);
    expect(view?.others.map((p) => p.id)).toEqual(['2', '4']);
  });

  it('is case-insensitive and returns null for an unknown category', async () => {
    expect((await make().category('JEWELERY'))?.category).toBe('jewelery');
    expect(await make().category('toys')).toBeNull();
  });
});

describe('CatalogueService.search', () => {
  it('only returns products whose text matches the term', async () => {
    const result = await make().search('headphones');
    expect(result.map((p) => p.id)).toEqual(['1']);
  });

  it('matches description and category, case-insensitively, requiring every word', async () => {
    expect((await make().search('BRIGHT display')).map((p) => p.id)).toEqual(['3']);
    expect((await make().search('jacket cotton')).map((p) => p.id)).toEqual(['7']);
    expect(await make().search('jacket gold')).toEqual([]);
  });

  it('returns nothing for a blank term', async () => {
    expect(await make().search('   ')).toEqual([]);
  });
});
