"""Review-only purpose selection; no changes to production recommendations."""

def evaluate(count, n, base_count, total, settings):
    if not (0 <= count <= n <= total and count <= base_count <= total
            and base_count - count <= total - n):
        raise ValueError('Inconsistent nested counts')
    rate = count / n if n else 0
    baseline = base_count / total if total else 0
    difference = rate - baseline
    lift = rate / baseline if baseline else None
    # Shrink the spot rate toward its same-period population rate.
    adjusted_difference = difference * n / (n + settings['shrinkage_k'])
    checks = {
        '地点回答数不足': n >= settings['minimum_spot_n'],
        '目的回答数不足': count >= settings['minimum_purpose_n'],
        '選択率不足': rate >= settings['minimum_rate'],
        '平均との差不足': difference + 1e-12 >= settings['minimum_difference'],
        '倍率不足': lift is not None and lift + 1e-12 >= settings['minimum_lift'],
    }
    return dict(count=count, n=n, base_count=base_count, total=total,
                rate=rate, baseline=baseline, difference=difference, lift=lift,
                adjusted_difference=adjusted_difference,
                eligible=all(checks.values()),
                failures=[name for name, passed in checks.items() if not passed])


def rank(candidates):
    return sorted(candidates, key=lambda c: (-c['adjusted_difference'], -c['count'], c['purpose']))


def select(candidates, override, settings):
    if override:
        chosen = next(c for c in candidates if c['purpose'] == override)
        # Editorial selection can override relative lift, not minimum support.
        if (chosen['n'] < settings['minimum_spot_n'] or
                chosen['count'] < settings['minimum_purpose_n'] or
                chosen['rate'] < settings['minimum_rate']):
            raise ValueError('指定目的の回答数・選択率が不足。表示方針を確認してください。')
        return chosen
    return next((c for c in rank(candidates) if c['eligible']), None)


def format_reason(candidate):
    return (f'この場所を選んだ人の{candidate["rate"]:.0%}が、旅の目的に'
            f'「{candidate["purpose"]}」を挙げています'
            f'（同期間の全体では{candidate["baseline"]:.0%}）。')
