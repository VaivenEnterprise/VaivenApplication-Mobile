import { imageKeys } from '@/features/images/keys';

describe('imageKeys', () => {
  it('la clave de la firma incluye la finalidad, para no mezclar fotos y evidencia', () => {
    expect(imageKeys.signature('item_photo')).toEqual(['images', 'signature', 'item_photo']);
    expect(imageKeys.signature('evidence')).not.toEqual(imageKeys.signature('item_photo'));
    expect(imageKeys.signature('evidence').slice(0, 1)).toEqual(imageKeys.all);
  });
});
