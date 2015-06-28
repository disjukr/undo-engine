export default async function throws(block) {
    let thrown = false;
    try {
        await block();
    } catch (e) {
        thrown = true;
    }
    if (!thrown) throw new Error('error not thrown');
}
