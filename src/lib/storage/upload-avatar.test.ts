import { describe, expect, it } from 'vitest'

import {
  getAvatarPublicUrl,
  parseStoredAvatarFileId,
} from '@/lib/storage/upload-avatar'

const nhost = {
  storage: {
    baseURL: 'https://storage.example.com',
  },
} as Parameters<typeof getAvatarPublicUrl>[0]

describe('parseStoredAvatarFileId', () => {
  it('extracts file id from nhost storage urls', () => {
    const fileId = '2c35b6f3-c4b9-48e3-978a-d4d0f1d42e24'

    expect(
      parseStoredAvatarFileId(`${nhost.storage.baseURL}/files/${fileId}`, nhost),
    ).toBe(fileId)
    expect(
      parseStoredAvatarFileId(
        `${nhost.storage.baseURL}/files/${fileId}?v=123`,
        nhost,
      ),
    ).toBe(fileId)
  })

  it('ignores external avatar urls', () => {
    expect(
      parseStoredAvatarFileId('https://cdn.example.com/avatar.jpg', nhost),
    ).toBeNull()
    expect(parseStoredAvatarFileId(null, nhost)).toBeNull()
  })
})

describe('getAvatarPublicUrl', () => {
  it('builds a public storage url', () => {
    expect(getAvatarPublicUrl(nhost, '2c35b6f3-c4b9-48e3-978a-d4d0f1d42e24')).toBe(
      'https://storage.example.com/files/2c35b6f3-c4b9-48e3-978a-d4d0f1d42e24',
    )
  })
})
