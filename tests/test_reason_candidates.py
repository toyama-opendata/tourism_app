import sys
from pathlib import Path
import pytest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from reason_candidates import evaluate, rank, select, format_reason

SETTINGS = dict(minimum_spot_n=30, minimum_purpose_n=10, minimum_rate=.1,
                minimum_difference=.05, minimum_lift=1.2, shrinkage_k=30)

def test_common_food_is_not_selected_over_characteristic_purpose():
    food = dict(purpose='食', **evaluate(70, 100, 700, 1000, SETTINGS))
    nature = dict(purpose='自然', **evaluate(40, 100, 200, 1000, SETTINGS))
    assert not food['eligible']
    assert nature['eligible']
    assert rank([food, nature])[0]['purpose'] == '自然'

@pytest.mark.parametrize('count,n,base,total,failure', [
    (15, 29, 100, 1000, '地点回答数不足'),
    (9, 50, 20, 1000, '目的回答数不足'),
    (10, 200, 10, 1000, '選択率不足'),
    (20, 100, 160, 1000, '平均との差不足'),
    (80, 100, 700, 1000, '倍率不足'),
])
def test_each_support_gate(count, n, base, total, failure):
    result = evaluate(count, n, base, total, SETTINGS)
    assert not result['eligible'] and failure in result['failures']

def test_boundary_and_shrinkage():
    result = evaluate(30, 100, 250, 1000, SETTINGS)
    assert result['eligible']
    assert result['adjusted_difference'] == pytest.approx(.05 * 100 / 130)

def test_zero_baseline_and_invalid_nested_counts():
    assert not evaluate(0, 30, 0, 100, SETTINGS)['eligible']
    with pytest.raises(ValueError):
        evaluate(20, 30, 10, 100, SETTINGS)

def test_editorial_override_uses_actual_count_even_below_relative_lift():
    c=dict(purpose='食', **evaluate(76,100,650,1000,SETTINGS))
    assert not c['eligible']
    assert select([c],'食',SETTINGS) is c
    assert '76%' in format_reason(c) and '65%' in format_reason(c)

def test_editorial_override_cannot_bypass_minimum_support():
    c=dict(purpose='食', **evaluate(2,100,10,1000,SETTINGS))
    with pytest.raises(ValueError):
        select([c],'食',SETTINGS)
    assert select([c],None,SETTINGS) is None
