// Every Phosphor glyph the app draws, each from its own module, and the only
// file that imports the package (the lint config refuses it anywhere else).
// The package's main entry re-exports every icon in six weights, and the dev
// server loads all of it on each page load: about half a second more per
// navigation, enough to push the colour tests past their time limit. The
// production build keeps only what is used either way. A new icon is added
// here first.
export type { Icon as Glyph } from '@phosphor-icons/react'
export { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft'
export { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight'
export { CalendarBlankIcon } from '@phosphor-icons/react/dist/csr/CalendarBlank'
export { ChatCircleIcon } from '@phosphor-icons/react/dist/csr/ChatCircle'
export { ChatsCircleIcon } from '@phosphor-icons/react/dist/csr/ChatsCircle'
export { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle'
export { CheckIcon } from '@phosphor-icons/react/dist/csr/Check'
export { CircleIcon } from '@phosphor-icons/react/dist/csr/Circle'
export { FireIcon } from '@phosphor-icons/react/dist/csr/Fire'
export { GearIcon } from '@phosphor-icons/react/dist/csr/Gear'
export { LightningIcon } from '@phosphor-icons/react/dist/csr/Lightning'
export { ListChecksIcon } from '@phosphor-icons/react/dist/csr/ListChecks'
export { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
export { MoonIcon } from '@phosphor-icons/react/dist/csr/Moon'
export { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple'
export { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus'
export { SignOutIcon } from '@phosphor-icons/react/dist/csr/SignOut'
export { SquareIcon } from '@phosphor-icons/react/dist/csr/Square'
export { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour'
export { SunIcon } from '@phosphor-icons/react/dist/csr/Sun'
export { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash'
export { UserCircleDashedIcon } from '@phosphor-icons/react/dist/csr/UserCircleDashed'
export { UserMinusIcon } from '@phosphor-icons/react/dist/csr/UserMinus'
export { UsersIcon } from '@phosphor-icons/react/dist/csr/Users'
