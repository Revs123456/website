import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AutoRefresh from '@/components/AutoRefresh';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AutoRefresh />
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </>
  );
}
