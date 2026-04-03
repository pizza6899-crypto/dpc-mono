import { UserArtifact } from './user-artifact.entity';

describe('UserArtifact', () => {
  it('create and equip/unequip behaviour', () => {
    const ua = UserArtifact.create(1n, 100n);
    expect(ua.id).toBe(0n);
    expect(ua.isEquipped).toBe(false);

    ua.equip(0); // invalid slot -> no-op
    expect(ua.isEquipped).toBe(false);

    ua.equip(1);
    expect(ua.isEquipped).toBe(true);
    expect(ua.slotNo).toBe(1);

    ua.unequip();
    expect(ua.isEquipped).toBe(false);
    expect(ua.slotNo).toBeNull();
  });
});
