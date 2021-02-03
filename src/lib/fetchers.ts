import { s3StateDownloader } from './s3-state-downloader'

export const fetchers = {
    s3: s3StateDownloader
} as const