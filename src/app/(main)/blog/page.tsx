import { permanentRedirect } from 'next/navigation';

// The home page is the blog now.
export default function BlogArchive() {
  permanentRedirect('/');
}
