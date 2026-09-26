import { Avatar } from '@mantine/core'
import { avatarDiscs, avatarInitials } from '../theme/avatars'

type Props = {
  name: string
  size?: 'sm' | 'md'
}

const sizes = { sm: 24, md: 32 }

// Initials on a coloured disc. Mantine hashes the name to pick the colour, so
// the same person always gets the same disc.
export function UserAvatar({ name, size = 'md' }: Props) {
  return (
    <Avatar
      name={name}
      color="initials"
      allowedInitialsColors={avatarDiscs}
      variant="filled"
      size={sizes[size]}
      radius="xl"
      styles={{ placeholder: { color: avatarInitials } }}
    />
  )
}
