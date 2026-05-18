export function mixFeedItems(posts: any[], banners: any[], programs: any[], products: any[]) {
  const mixed: any[] = [];
  let bannerIndex = 0;
  let programIndex = 0;
  let productIndex = 0;

  posts.forEach((post, i) => {
    mixed.push({ type: 'post', data: post });

    // Insert sponsor banner every 6 posts
    if ((i + 1) % 6 === 0 && banners && bannerIndex < banners.length) {
      mixed.push({ type: 'banner', data: banners[bannerIndex] });
      bannerIndex++;
    }

    // Insert program every 8 posts
    if ((i + 1) % 8 === 0 && programs && programIndex < programs.length) {
      mixed.push({ type: 'program', data: programs[programIndex] });
      programIndex++;
    }

    // Insert product every 10 posts
    if ((i + 1) % 10 === 0 && products && productIndex < products.length) {
      mixed.push({ type: 'product', data: products[productIndex] });
      productIndex++;
    }
  });

  return mixed;
}
