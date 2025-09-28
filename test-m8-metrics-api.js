/**
 * 测试 M8 指标与可视化 API
 */

const API_BASE = 'http://localhost:3000';

async function testMetricsAPI() {
  console.log('🧪 测试 M8 指标与可视化 API\n');

  try {
    // 测试 1: 趋势 API - 多维度查询
    console.log('📊 测试 1: 趋势 API - 多维度查询');
    const trendResponse = await fetch(`${API_BASE}/metrics/students/stu_1/trend?dims=study_minutes,levels_completed,accuracy&period=weekly&from=2025-08-01&to=2025-09-28`, {
      headers: {
        'x-user-id': 'parent_1'
      }
    });
    
    if (trendResponse.ok) {
      const trendData = await trendResponse.json();
      console.log('✅ 趋势 API 成功');
      console.log(`   学生ID: ${trendData.studentId}`);
      console.log(`   周期: ${trendData.period}`);
      console.log(`   维度数量: ${trendData.series.length}`);
      console.log(`   数据点示例:`, trendData.series[0]?.points?.slice(0, 2));
    } else {
      console.log('❌ 趋势 API 失败:', trendResponse.status, await trendResponse.text());
    }

    console.log('');

    // 测试 2: 对比 API - 班级横向对比
    console.log('📊 测试 2: 对比 API - 班级横向对比');
    const compareResponse = await fetch(`${API_BASE}/metrics/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'teacher_1'
      },
      body: JSON.stringify({
        classId: 'cls_1',
        dims: ['levels_completed', 'retry_count', 'accuracy'],
        period: 'weekly',
        week: '2025-09-22'
      })
    });

    if (compareResponse.ok) {
      const compareData = await compareResponse.json();
      console.log('✅ 对比 API 成功');
      console.log(`   班级ID: ${compareData.classId}`);
      console.log(`   周期: ${compareData.period}`);
      console.log(`   时间桶: ${compareData.bucket}`);
      console.log(`   学生数量: ${compareData.rows.length}`);
      console.log(`   学生示例:`, compareData.rows.slice(0, 2));
    } else {
      console.log('❌ 对比 API 失败:', compareResponse.status, await compareResponse.text());
    }

    console.log('');

    // 测试 3: 权限验证 - 家长访问班级对比（应该失败）
    console.log('🔒 测试 3: 权限验证 - 家长访问班级对比');
    const authResponse = await fetch(`${API_BASE}/metrics/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'parent_1'
      },
      body: JSON.stringify({
        classId: 'cls_1',
        dims: ['levels_completed'],
        period: 'weekly',
        week: '2025-09-22'
      })
    });

    if (authResponse.status === 403) {
      console.log('✅ 权限验证成功 - 家长被正确拒绝访问班级对比');
    } else {
      console.log('❌ 权限验证失败 - 家长应该被拒绝访问班级对比');
    }

    console.log('');

    // 测试 4: 缓存功能
    console.log('💾 测试 4: 缓存功能');
    const startTime = Date.now();
    
    // 第一次请求
    await fetch(`${API_BASE}/metrics/students/stu_1/trend?dims=study_minutes&period=daily&from=2025-09-01&to=2025-09-07`, {
      headers: { 'x-user-id': 'parent_1' }
    });
    
    const firstRequestTime = Date.now() - startTime;
    
    // 第二次请求（应该从缓存返回）
    const cacheStartTime = Date.now();
    await fetch(`${API_BASE}/metrics/students/stu_1/trend?dims=study_minutes&period=daily&from=2025-09-01&to=2025-09-07`, {
      headers: { 'x-user-id': 'parent_1' }
    });
    
    const secondRequestTime = Date.now() - cacheStartTime;
    
    console.log(`   第一次请求时间: ${firstRequestTime}ms`);
    console.log(`   第二次请求时间: ${secondRequestTime}ms`);
    
    if (secondRequestTime < firstRequestTime) {
      console.log('✅ 缓存功能正常 - 第二次请求更快');
    } else {
      console.log('⚠️  缓存可能未生效 - 两次请求时间相近');
    }

    console.log('');

    // 测试 5: 空数据状态
    console.log('📊 测试 5: 空数据状态处理');
    const emptyResponse = await fetch(`${API_BASE}/metrics/students/empty_student/trend?dims=study_minutes&period=daily&from=2025-01-01&to=2025-01-07`, {
      headers: { 'x-user-id': 'parent_1' }
    });

    if (emptyResponse.ok) {
      const emptyData = await emptyResponse.json();
      console.log('✅ 空数据状态处理正常');
      console.log(`   返回了 ${emptyData.series.length} 个维度`);
    } else {
      console.log('❌ 空数据状态处理失败:', emptyResponse.status);
    }

    console.log('\n🎉 M8 指标与可视化 API 测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testMetricsAPI();
