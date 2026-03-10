import React, { useMemo, useState } from "react";

const CIVS = [
  "爱法", "爱英", "努比亚", "旧高卢", "男拜", "北条时宗", "俄罗斯", "男希腊",
  "成吉思汗", "腓尼基", "高棉", "西班牙", "德国", "甘地", "女希腊", "北境王",
  "巴比伦", "忽必烈蒙古", "忽必烈中国", "苏美尔", "居鲁士", "黑法", "金法", "瑞典",
  "地中海新娘", "毛利", "马普切", "玛雅", "苏格兰", "曼沙穆萨", "阿兹特克", "埃塞俄比亚",
  "男刚果", "印加", "克里", "巴西", "祖鲁", "天命者", "葡萄牙", "文阿拉伯",
  "善德", "立法者", "格鲁吉亚", "文美国", "武美国", "印度尼西亚", "图拉真", "斯基泰",
  "加拿大", "荷兰", "帝英", "大哥伦比亚", "匈牙利", "波兰", "亚历山大", "澳大利亚",
  "武印度", "越南", "林肯", "女刚果", "武阿拉伯", "德川家康", "大帝奥斯曼", "纳迪尔沙阿",
  "武则天", "大一统", "朱棣", "瓦良格", "蒸英", "伊丽莎白", "松迪亚塔", "托勒密埃及",
  "拉美西斯", "女拜", "世宗大王", "路二", "凯撒", "阿希拉姆", "哈桑伊本", "图勒",
  "吐蕃", "新高卢", "猫头鹰", "男玛雅", "女马其顿"
];

function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = getSecureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function parseNumbers(text) {
  return [...new Set(
    text
      .split(/[\s,，、;；]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number(item))
      .filter((num) => Number.isInteger(num) && num >= 1 && num <= CIVS.length)
  )];
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Civ6RoleAssignerAccessibleSite() {
  const [players, setPlayers] = useState(4);
  const [bannedSet, setBannedSet] = useState(new Set());
  const [quickBanInput, setQuickBanInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [result, setResult] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("请选择人数并设置 ban 文明，然后点击生成分配。");

  const civObjects = useMemo(
    () => CIVS.map((name, index) => ({ id: index + 1, name, index })),
    []
  );

  const bannedList = useMemo(
    () => civObjects.filter((item) => bannedSet.has(item.index)),
    [bannedSet, civObjects]
  );

  const availableList = useMemo(
    () => civObjects.filter((item) => !bannedSet.has(item.index)),
    [bannedSet, civObjects]
  );

  const filteredCivs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return civObjects.filter((item) => {
      const matchKeyword = !keyword || `${item.id} ${item.name}`.toLowerCase().includes(keyword);
      const isBanned = bannedSet.has(item.index);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && !isBanned) ||
        (statusFilter === "banned" && isBanned);
      return matchKeyword && matchStatus;
    });
  }, [search, statusFilter, civObjects, bannedSet]);

  const availableCount = availableList.length;
  const requiredCount = Number(players) * 4;

  function toggleBan(index) {
    setError("");
    setResult([]);
    setBannedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setStatus("文明池已更新。被 ban 的文明会立即移动到已 ban 区域并变红显示。");
  }

  function applyQuickBan() {
    const numbers = parseNumbers(quickBanInput);
    if (numbers.length === 0) {
      setError("没有识别到有效编号，请输入 1 到 85 之间的数字，可用空格或逗号分隔。");
      setStatus("快速 ban 输入无效。");
      return;
    }

    setBannedSet((prev) => {
      const next = new Set(prev);
      numbers.forEach((num) => next.add(num - 1));
      return next;
    });
    setError("");
    setResult([]);
    setStatus(`已根据编号加入 ${numbers.length} 个 ban 文明。`);
  }

  function clearBan() {
    setBannedSet(new Set());
    setQuickBanInput("");
    setError("");
    setResult([]);
    setStatus("已清空 ban 列表。所有文明重新进入可用池。");
  }

  function resetAll() {
    setPlayers(4);
    setBannedSet(new Set());
    setQuickBanInput("");
    setSearch("");
    setStatusFilter("all");
    setResult([]);
    setError("");
    setStatus("已重置为默认状态。");
  }

  function generateAssignments() {
    const n = Number(players);

    if (!Number.isInteger(n) || n <= 0 || n >= 15) {
      setError("总人数必须是 1 到 14 的整数。");
      setResult([]);
      setStatus("人数输入不合法。");
      return;
    }

    if (availableCount < requiredCount) {
      setError(`可用文明数量不足：当前剩余 ${availableCount} 个文明，但 ${n} 位玩家需要 ${requiredCount} 个文明。`);
      setResult([]);
      setStatus("可用文明数量不足，无法生成分配。");
      return;
    }

    const shuffled = shuffle(availableList);
    const nextResult = [];

    for (let i = 0; i < n; i += 1) {
      nextResult.push({
        player: i + 1,
        civs: shuffled.slice(i * 4, i * 4 + 4),
      });
    }

    setError("");
    setResult(nextResult);
    setStatus(`已成功为 ${n} 位玩家生成文明分配结果。`);
  }

  const copyText = useMemo(() => {
    if (result.length === 0) return "";
    return result
      .map((item) => `玩家${item.player}: ${item.civs.map((civ) => civ.name).join("、")}`)
      .join("\n");
  }, [result]);

  async function copyResult() {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus("结果已复制到剪贴板。");
    } catch {
      setStatus("复制失败，请手动复制结果。\n" + copyText);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
          <p className="text-sm font-medium tracking-[0.2em] text-slate-300">CIVILIZATION VI RANDOM ASSIGNER</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">文明6 FFA角色随机分配</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200">
                支持一键 ban、即时可视化文明池、随机分配、复制结果。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xs text-slate-300">总文明</div>
                <div className="mt-1 text-xl font-bold">85</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xs text-slate-300">已 ban</div>
                <div className="mt-1 text-xl font-bold">{bannedList.length}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xs text-slate-300">可用</div>
                <div className="mt-1 text-xl font-bold">{availableCount}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xs text-slate-300">当前需求</div>
                <div className="mt-1 text-xl font-bold">{requiredCount}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-red-700">已 ban 文明</h2>
              <p className="mt-1 text-sm text-slate-600">这里会持续显示当前被 ban 的文明，开房时能直观看到禁用池。</p>
            </div>
            {bannedList.length > 0 ? (
              <button
                type="button"
                onClick={clearBan}
                className="inline-flex rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                一键清空 ban
              </button>
            ) : null}
          </div>
          <div className="mt-4 min-h-20 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
            {bannedList.length === 0 ? (
              <p className="text-sm text-red-700/80">当前还没有 ban 文明。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bannedList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleBan(item.index)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                    aria-label={`取消 ban：编号 ${item.id}，${item.name}`}
                  >
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">#{item.id}</span>
                    <span>{item.name}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">控制面板</h2>
              <form
                className="mt-5 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  generateAssignments();
                }}
              >
                <div>
                  <label htmlFor="players" className="mb-2 block text-sm font-medium text-slate-700">
                    总人数
                  </label>
                  <input
                    id="players"
                    name="players"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={14}
                    value={players}
                    onChange={(e) => {
                      setPlayers(e.target.value);
                      setError("");
                      setResult([]);
                    }}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="quick-ban" className="mb-2 block text-sm font-medium text-slate-700">
                    快速 ban 编号
                  </label>
                  <textarea
                    id="quick-ban"
                    name="quick-ban"
                    rows={3}
                    value={quickBanInput}
                    onChange={(e) => setQuickBanInput(e.target.value)}
                    placeholder="例如：5 47 62"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={applyQuickBan}
                      className="inline-flex rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      应用快速 ban
                    </button>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      重置全部
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700">分配结果</h3>
                  {result.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">尚未生成分配结果。</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {result.map((item) => (
                        <div key={item.player} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <div className="text-sm font-semibold text-slate-800">玩家 {item.player}</div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {item.civs.map((civ) => (
                              <div key={`${item.player}-${civ.id}`} className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900 ring-1 ring-blue-100">
                                {civ.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={copyResult}
                          className="inline-flex rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                          复制结果
                        </button>
                        <button
                          type="submit"
                          className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          重新生成
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  生成分配
                </button>
              </form>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">运行状态</h2>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                {status}
              </div>
              {error ? (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold">文明池</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  点击文明卡片即可切换 ban。被 ban 的文明会显示为红底、红边、带状态标签，并同步进入上方已 ban 区域。
                </p>
              </div>
              <div className="w-full lg:max-w-sm">
                <label htmlFor="search" className="mb-2 block text-sm font-medium text-slate-700">
                  搜索文明
                </label>
                <input
                  id="search"
                  name="search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="输入编号或名称"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { key: "all", label: `全部 ${civObjects.length}` },
                { key: "available", label: `可用 ${availableCount}` },
                { key: "banned", label: `已 ban ${bannedList.length}` },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(item.key)}
                  className={classNames(
                    "rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2",
                    statusFilter === item.key
                      ? "bg-slate-900 text-white focus:ring-slate-300"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <fieldset className="mt-6">
              <legend className="sr-only">文明 ban 选择列表</legend>
              <div className="mb-4 text-sm text-slate-500">
                当前显示 {filteredCivs.length} 个文明。
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCivs.map((item) => {
                  const isBanned = bannedSet.has(item.index);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleBan(item.index)}
                      className={classNames(
                        "group relative overflow-hidden rounded-3xl border px-4 py-4 text-left shadow-sm transition focus:outline-none focus:ring-2",
                        isBanned
                          ? "border-red-300 bg-red-50 text-red-900 focus:ring-red-200"
                          : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:shadow-md focus:ring-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className={classNames(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                              isBanned ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
                            )}
                          >
                            #{item.id}
                          </div>
                          <div className="mt-3 text-base font-semibold">{item.name}</div>
                        </div>
                        <div
                          className={classNames(
                            "rounded-full px-2.5 py-1 text-xs font-bold",
                            isBanned ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          {isBanned ? "已 ban" : "可用"}
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-slate-500">
                        {isBanned ? "点击可取消 ban 并恢复到文明池" : "点击即可加入 ban 列表"}
                      </div>
                      {isBanned ? (
                        <div className="pointer-events-none absolute inset-0 bg-red-500/5" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </section>
        </div>
      </div>
    </main>
  );
}