import { getPosts, getPostsCount, getCategories } from "@/lib/posts";
import { HeroMagazineGrid } from "@/components/home/HeroMagazineGrid";
import { PopularPostsWidget } from "@/components/home/PopularPostsWidget";
import { FacultySection } from "@/components/home/FacultySection";
import { EditorialSection, EDITORIAL_PAGE_SIZE } from "@/components/home/EditorialSection";
import { SocialFollowWidget } from "@/components/sidebar/SocialFollowWidget";
import { SidebarWidgets } from "@/components/sidebar/SidebarWidgets";
import { CategoriesWidget } from "@/components/sidebar/CategoriesWidget";

export default async function HomePage() {
  const [allPosts, categories, totalPostCount] = await Promise.all([
    getPosts({ limit: 30 }),
    getCategories(),
    getPostsCount(),
  ]);
  const trendingPosts = [...allPosts].sort((a, b) => b.hotScore - a.hotScore);
  const initialTotalPages = Math.max(1, Math.ceil(totalPostCount / EDITORIAL_PAGE_SIZE));

  return (
    <div className="w-full bg-[#FAFAFA] pb-16">
      <HeroMagazineGrid posts={allPosts} />

      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <CategoriesWidget categories={categories} />
            <PopularPostsWidget posts={allPosts} />
          </div>

          <div className="lg:col-span-6 space-y-8">
            <FacultySection posts={allPosts} />
            <EditorialSection initialPosts={allPosts} initialTotalPages={initialTotalPages} />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <SocialFollowWidget />
            <SidebarWidgets trendingPosts={trendingPosts} />
          </div>
        </div>
      </div>
    </div>
  );
}
